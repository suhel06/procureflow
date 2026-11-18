
const Item = require("../models/Item");
const Contract = require("../models/Contract");
const ContractLine = require("../models/ContractLine");
const Supplier = require("../models/Supplier");
const PurchaseHistory = require("../models/PurchaseHistory");

const DAY = 24 * 60 * 60 * 1000;

function daysBefore(date, days) {
    return new Date(new Date(date).getTime() - days * DAY);
}

function getRule(policy, route) {
    const rules = policy.rules.decisionRules || [];
    return rules.find(rule => rule.route === route);
}

// Extract thresholds from the existing policy condition strings,
// e.g. emergency_and_value_lte_500000.
function getThreshold(rule) {
    if (!rule || !rule.condition) {
        throw new Error("Missing policy decision rule or condition");
    }

    const match = rule.condition.match(
        /(?:lte|lt|gte|gt)_(\d+(?:\.\d+)?)/
    );

    if (!match) {
        throw new Error(
            `Could not read threshold from policy condition: ${rule.condition}`
        );
    }

    return Number(match[1]);
}

function getPolicyClause(policy, route) {
    const rule = getRule(policy, route);
    return rule ? rule.clause : null;
}

function getCategoryValues(categories) {
    if (Array.isArray(categories)) {
        return categories.map(value =>
            String(value).trim().toLowerCase()
        );
    }

    return String(categories || "")
        .split(",")
        .map(value => value.trim().toLowerCase())
        .filter(Boolean);
}

function matchesCategory(supplier, category) {
    const supplierCategories = getCategoryValues(
        supplier.categories
    );

    return supplierCategories.includes(
        String(category || "").trim().toLowerCase()
    );
}

function getRecencyScore(days, rankingRules) {
    const bands = rankingRules.recencyBands || [];

    const band = bands.find(entry =>
        entry.maxDays === null || days <= entry.maxDays
    );

    return band ? band.score : 0;
}

function rankSupplier(entry, requirementDate, rankingRules) {
    const supplier = entry.supplier;

    const recency = entry.latestPO
        ? Math.max(
            0,
            (requirementDate - new Date(entry.latestPO.po_date)) / DAY
        )
        : Infinity;

    const recencyScore = getRecencyScore(
        recency,
        rankingRules
    );

    const score =
        entry.poCount * rankingRules.purchaseFrequencyWeight +
        recencyScore * rankingRules.recencyWeight +
        (entry.hasContract
            ? rankingRules.contractHistoryWeight
            : 0) +
        Number(supplier.on_time_pct || 0) *
            rankingRules.onTimeDeliveryWeight +
        Number(supplier.quality_rating || 0) *
            rankingRules.qualityWeight;

    return {
        supplier_id: supplier.supplier_id,
        supplier_name: supplier.name,
        score,
        reference_price: entry.referencePrice ?? null
    };
}

async function evaluateRequirement(
    requirement,
    policy,
    consumptionTracker = new Map()
) {
    if (!policy || !policy.rules) {
        throw new Error("Active procurement policy is required");
    }

    const {
        resolved_item_code,
        total_quantity,
        plant,
        first_created_at,
        is_emergency,
        lines
    } = requirement;

    const rules = policy.rules;
    const requirementDate = new Date(first_created_at);

    if (Number.isNaN(requirementDate.getTime())) {
        throw new Error(
            `Invalid requirement date: ${requirement.group_id}`
        );
    }

    // 1. Validate plant against policy scope.
    const allowedPlants = rules.scope.plants || [];

    if (!allowedPlants.includes(plant)) {
        return {
            group_id: requirement.group_id,
            item_code: resolved_item_code,
            plant,
            decision: "MANUAL_REVIEW",
            route: "INVALID_PLANT",
            policy_version: policy.version,
            reason: `Plant ${plant} is outside policy scope`
        };
    }

    // 2. Handle new items.
    if (resolved_item_code === "NEW") {
        const line = lines[0];

        const value =
            Number(line.quantity || 0) *
            Number(line.estimated_unit_price || 0);

        return {
            group_id: requirement.group_id,
            item_code: "NEW",
            plant,
            total_quantity,
            decision: "SOURCING",
            route: "NEW_ITEM_SOURCING",
            requirement_value: value,
            supplier_id: null,
            policy_version: policy.version,
            policy_clause: "1.2",
            reason: "New item requires sourcing"
        };
    }

    // 3. Fetch item details.
    const item = await Item.findOne({
        item_code: resolved_item_code
    }).lean();

    if (!item) {
        throw new Error(
            `Item not found: ${resolved_item_code}`
        );
    }

    // 4. Fetch active suppliers.
    const suppliers = await Supplier.find({
        status: rules.suppliers.activeStatus
    }).lean();

    const supplierMap = new Map(
        suppliers.map(supplier => [
            supplier.supplier_id,
            supplier
        ])
    );

    // 5. Find contracts covering this item.
    const contractLines = await ContractLine.find({
        item_code: resolved_item_code
    }).lean();

    const contractLineMap = new Map(
        contractLines.map(line => [
            line.contract_id,
            line
        ])
    );

    const contractIds = [...contractLineMap.keys()];

    const contracts = await Contract.find({
        contract_id: { $in: contractIds },
        start_date: { $lte: requirementDate },
        end_date: { $gte: requirementDate }
    }).lean();

    const applicableContracts = contracts
        .filter(contract =>
            supplierMap.has(contract.supplier_id) &&
            contractLineMap.has(contract.contract_id)
        )
        .map(contract => ({
            ...contract,
            rate: Number(
                contractLineMap.get(contract.contract_id).rate
            )
        }))
        .filter(contract =>
            Number.isFinite(contract.rate) &&
            contract.rate >= 0
        )
        .sort((a, b) =>
            a.rate - b.rate ||
            a.contract_id.localeCompare(b.contract_id)
        );

    // 6. Check cumulative contract ceiling.
    const contractsWithCapacity = applicableContracts.filter(
        contract => {
            const previousConsumption =
                consumptionTracker.has(contract.contract_id)
                    ? consumptionTracker.get(contract.contract_id)
                    : Number(contract.consumed_value || 0);

            const requirementCost =
                Number(total_quantity) * contract.rate;

            return (
                previousConsumption + requirementCost <=
                Number(contract.value_cap)
            );
        }
    );

    const selectedContract = contractsWithCapacity[0] || null;

    // 7. Fetch purchase history once for 548 days.
    const history548 = await PurchaseHistory.find({
        item_code: resolved_item_code,
        po_date: {
            $gte: daysBefore(
                requirementDate,
                rules.suppliers.preferredHistoryDays
            ),
            $lt: requirementDate
        }
    }).lean();

    const activeHistory548 = history548.filter(record =>
        supplierMap.has(record.supplier_id)
    );

    const activeHistory365 = activeHistory548.filter(record =>
        new Date(record.po_date) >=
        daysBefore(
            requirementDate,
            rules.valuation.purchaseHistoryDays
        )
    );

    const latestHistory365 = [...activeHistory365].sort(
        (a, b) =>
            new Date(b.po_date) - new Date(a.po_date)
    )[0];

    // 8. Determine valuation price.
    let unitPrice;

    if (selectedContract) {
        unitPrice = selectedContract.rate;
    } else if (applicableContracts.length > 0) {
        unitPrice = applicableContracts[0].rate;
    } else if (latestHistory365) {
        unitPrice = Number(latestHistory365.unit_price);
    } else {
        unitPrice = Number(item.standard_price);
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error(
            `Invalid valuation price for ${resolved_item_code}`
        );
    }

    // 9. Build preferred supplier history.
    const preferredMap = new Map();

    for (const record of activeHistory548) {
        const supplier = supplierMap.get(record.supplier_id);

        if (!preferredMap.has(record.supplier_id)) {
            preferredMap.set(record.supplier_id, {
                supplier,
                poCount: 0,
                latestPO: null,
                hasContract: false,
                referencePrice: null
            });
        }

        const entry = preferredMap.get(record.supplier_id);

        entry.poCount++;

        if (
            !entry.latestPO ||
            new Date(record.po_date) >
                new Date(entry.latestPO.po_date)
        ) {
            entry.latestPO = record;
            entry.referencePrice = Number(record.unit_price);
        }
    }

    // Include historical contract suppliers.
    const historicalContracts = await Contract.find({
        start_date: { $lte: requirementDate }
    }).lean();

    const historicalContractIds = historicalContracts.map(
        contract => contract.contract_id
    );

    const historicalLines = await ContractLine.find({
        item_code: resolved_item_code,
        contract_id: { $in: historicalContractIds }
    }).lean();

    const historicalLineMap = new Map(
        historicalLines.map(line => [
            line.contract_id,
            line
        ])
    );

    for (const contract of historicalContracts) {
        const supplier = supplierMap.get(contract.supplier_id);

        if (!supplier) continue;

        const contractLine = historicalLineMap.get(
            contract.contract_id
        );

        if (!contractLine) continue;

        if (!preferredMap.has(contract.supplier_id)) {
            preferredMap.set(contract.supplier_id, {
                supplier,
                poCount: 0,
                latestPO: null,
                hasContract: true,
                referencePrice: Number(contractLine.rate),
                latestContractDate: contract.start_date
            });
        } else {
            const entry = preferredMap.get(contract.supplier_id);

            entry.hasContract = true;

            if (
                !entry.latestContractDate ||
                new Date(contract.start_date) >
                    new Date(entry.latestContractDate)
            ) {
                entry.latestContractDate = contract.start_date;

                if (!entry.latestPO) {
                    entry.referencePrice = Number(contractLine.rate);
                }
            }
        }
    }

    // 10. Rank preferred suppliers.
    const rankingRules = rules.suppliers.ranking;

    let preferredSuppliers = [...preferredMap.values()]
        .map(entry =>
            rankSupplier(
                entry,
                requirementDate,
                rankingRules
            )
        )
        .sort((a, b) => b.score - a.score);

    // 11. Fill sourcing shortlist using item category.
    const fallbackRules = rules.suppliers.sourcingFallback;

    const sourcingRule = rules.decisionRules || [];

    const capexRule = sourcingRule.find(
        rule => rule.route === "CAPEX_SOURCING"
    );

    const rfqRule = sourcingRule.find(
        rule => rule.route === "RFQ"
    );

    const rfpRule = sourcingRule.find(
        rule => rule.route === "RFP"
    );

    const maximumShortlist = Math.max(
        Number(capexRule?.supplierCount || 5),
        Number(rfqRule?.supplierCount || 3),
        Number(rfpRule?.supplierCount || 5)
    );

    const sourcingSuppliers = [...preferredSuppliers];

    if (fallbackRules.fillFromItemCategory) {
        const existingIds = new Set(
            sourcingSuppliers.map(s => s.supplier_id)
        );

        const categorySuppliers = suppliers
            .filter(supplier =>
                !existingIds.has(supplier.supplier_id) &&
                matchesCategory(supplier, item.category)
            )
            .sort((a, b) =>
                Number(b.on_time_pct || 0) -
                    Number(a.on_time_pct || 0) ||
                Number(b.quality_rating || 0) -
                    Number(a.quality_rating || 0)
            );

        for (const supplier of categorySuppliers) {
            if (sourcingSuppliers.length >= maximumShortlist) {
                break;
            }

            sourcingSuppliers.push({
                supplier_id: supplier.supplier_id,
                supplier_name: supplier.name,
                score: 0,
                reference_price: null
            });
        }
    }

    // 12. Load configurable decision rules.
    const emergencyRule = getRule(policy, "EMERGENCY_PO");
    const spotRule = getRule(policy, "SPOT_PO");
    const emergencyLimit = getThreshold(emergencyRule);
    const spotLimit = getThreshold(spotRule);
    const rfqLimit = getThreshold(rfqRule);
    const rfpLimit = getThreshold(rfpRule);

    const baseRequirementValue =
        Number(total_quantity) * unitPrice;

    let result;
    let finalUnitPrice = unitPrice;
    let requirementValue = baseRequirementValue;

    // 13. Apply policy decisions in priority order.

    if (
        String(item.item_type).toLowerCase() === "capex"
    ) {
        result = {
            decision: "SOURCING",
            route: "CAPEX_SOURCING",
            policy_clause: getPolicyClause(
                policy,
                "CAPEX_SOURCING"
            ),
            suppliers: sourcingSuppliers.slice(
                0,
                Number(capexRule?.supplierCount || 5)
            ),
            reason: "Capital expenditure requires sourcing"
        };

    } else if (selectedContract) {
        result = {
            decision: "PO",
            route: "CONTRACT_PO",
            policy_clause: getPolicyClause(
                policy,
                "CONTRACT_PO"
            ),
            supplier_id: selectedContract.supplier_id,
            supplier_name: selectedContract.supplier_name,
            contract_id: selectedContract.contract_id,
            reason: "Valid contract with available ceiling"
        };

        finalUnitPrice = selectedContract.rate;
        requirementValue =
            Number(total_quantity) * finalUnitPrice;

    } else {
        const preferredSupplier = preferredSuppliers[0];

        const directPrice =
            preferredSupplier?.reference_price != null &&
            Number.isFinite(
                Number(preferredSupplier.reference_price)
            )
                ? Number(preferredSupplier.reference_price)
                : unitPrice;

        const directValue =
            Number(total_quantity) * directPrice;

        if (
            is_emergency &&
            directValue <= emergencyLimit &&
            activeHistory365.length > 0 &&
            preferredSupplier
        ) {
            finalUnitPrice = directPrice;
            requirementValue = directValue;

            result = {
                decision: "PO",
                route: "EMERGENCY_PO",
                policy_clause: emergencyRule.clause,
                supplier_id: preferredSupplier.supplier_id,
                supplier_name: preferredSupplier.supplier_name,
                reason: "Emergency requirement qualifies for direct PO"
            };

        } else if (
            directValue < spotLimit &&
            activeHistory365.length > 0 &&
            preferredSupplier
        ) {
            finalUnitPrice = directPrice;
            requirementValue = directValue;

            result = {
                decision: "PO",
                route: "SPOT_PO",
                policy_clause: spotRule.clause,
                supplier_id: preferredSupplier.supplier_id,
                supplier_name: preferredSupplier.supplier_name,
                reason: "Requirement qualifies for spot purchase"
            };

        } else if (baseRequirementValue < rfqLimit) {
            result = {
                decision: "SOURCING",
                route: "RFQ",
                policy_clause: rfqRule.clause,
                suppliers: sourcingSuppliers.slice(
                    0,
                    Number(rfqRule.supplierCount || 3)
                ),
                reason: "Requirement falls within RFQ threshold"
            };

        } else if (baseRequirementValue >= rfpLimit) {
            result = {
                decision: "SOURCING",
                route: "RFP",
                policy_clause: rfpRule.clause,
                suppliers: sourcingSuppliers.slice(
                    0,
                    Number(rfpRule.supplierCount || 5)
                ),
                reason: "Requirement meets RFP threshold"
            };

        } else {
            throw new Error(
                `No procurement route covers value ${baseRequirementValue}`
            );
        }
    }

    // 14. Update shared contract consumption only after
    // the requirement receives a contract PO decision.
    if (
        result.route === "CONTRACT_PO" &&
        selectedContract
    ) {
        const previousConsumption =
            consumptionTracker.has(selectedContract.contract_id)
                ? consumptionTracker.get(selectedContract.contract_id)
                : Number(selectedContract.consumed_value || 0);

        consumptionTracker.set(
            selectedContract.contract_id,
            previousConsumption + requirementValue
        );
    }

    return {
        group_id: requirement.group_id,
        item_code: resolved_item_code,
        plant,
        total_quantity,
        unit_price: finalUnitPrice,
        requirement_value: requirementValue,
        is_emergency: Boolean(is_emergency),

        policy_id: policy.policy_id,
        policy_version: policy.version,

        ...result
    };
}

module.exports = {
    evaluateRequirement
};
