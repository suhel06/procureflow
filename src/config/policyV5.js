
const policyV5 = {
    policy_id: "CORVO-PROC-POL-04",
    version: "5.0",
    effective_from: new Date("2026-04-01"),
    is_active: true,

    description: "Corvo Engineering Procurement Policy v5.0",

    rules: {
        scope: {
            plants: ["PUN1", "CHK1"],
            currency: "INR",
            gst_included: false
        },

        itemMatching: {
            useProvidedItemCodeFirst: true,
            unmatchedItemRoute: "NEW_ITEM_SOURCING",
            clubNewItems: false,
            newItemPrice: "estimated_unit_price"
        },

        clubbing: {
            creationWindowDays: 14,
            needByWindowDays: 7,
            sortBy: ["created_at", "pr_no", "pr_line"],
            joinEarliestEligibleRequirement: true,
            emergencyIfAnyLineEmergency: true
        },

        valuation: {
            priority: [
                "selected_contract_rate",
                "lowest_applicable_contract_rate_if_all_over_ceiling",
                "latest_po_price_within_365_days",
                "item_standard_price"
            ],
            purchaseHistoryDays: 365
        },

        contracts: {
            validityInclusive: true,
            activeSupplierOnly: true,
            requireItemCoverage: true,
            ceilingBasedOnConsumedValue: true,
            processInRequirementDateOrder: true,
            selectLowestRateWithAvailableCeiling: true,
            pdfOnlyContractsStartWithZeroConsumption: true
        },

        decisionRules: [
            {
                priority: 1,
                clause: "5.1",
                condition: "item_type_is_capex",
                decision: "SOURCING_REQUEST",
                route: "CAPEX_SOURCING",
                supplierCount: 5,
                requiresCapexApproval: true
            },
            {
                priority: 2,
                clause: "5.2",
                condition: "eligible_contract_with_available_ceiling",
                decision: "PO",
                route: "CONTRACT_PO",
                priceSource: "contract_rate"
            },
            {
                priority: 3,
                clause: "5.3",
                condition: "emergency_and_value_lte_500000_and_recent_purchase",
                decision: "PO",
                route: "EMERGENCY_PO",
                priceSource: "preferred_supplier_reference_price"
            },
            {
                priority: 4,
                clause: "5.4",
                condition: "value_lt_200000_and_recent_purchase",
                decision: "PO",
                route: "SPOT_PO",
                priceSource: "preferred_supplier_reference_price"
            },
            {
                priority: 5,
                clause: "5.5",
                condition: "value_lt_1000000",
                decision: "SOURCING_REQUEST",
                route: "RFQ",
                supplierCount: 3
            },
            {
                priority: 6,
                clause: "5.6",
                condition: "value_gte_1000000",
                decision: "SOURCING_REQUEST",
                route: "RFP",
                supplierCount: 5
            }
        ],

        suppliers: {
            activeStatus: "Active",
            preferredHistoryDays: 548,

            ranking: {
                purchaseFrequencyWeight: 10,
                recencyWeight: 5,
                contractHistoryWeight: 5,
                onTimeDeliveryWeight: 0.05,
                qualityWeight: 1,

                recencyBands: [
                    { maxDays: 90, score: 1 },
                    { maxDays: 365, score: 0.5 },
                    { maxDays: null, score: 0 }
                ]
            },

            referencePricePriority: [
                "most_recent_po_within_548_days",
                "most_recent_contract_rate"
            ],

            sourcingFallback: {
                usePreferredSuppliersFirst: true,
                fillFromItemCategory: true,
                fallbackSortBy: [
                    "on_time_pct_desc",
                    "quality_rating_desc"
                ]
            },

            excludeInactiveAndBlocked: true,
            newItemSupplierSuggestions: false
        },

        consolidation: {
            enabled: true,
            timeWindowHours: 24,
            sameSupplier: true,
            samePlant: true,
            sameRoute: true,
            processChronologically: true,
            joinEarliestEligiblePO: true,
            consolidateSourcingRequests: false
        },

        recordKeeping: {
            storePolicyVersion: true,
            storePolicyClause: true,
            storeContractReference: true,
            storePOReference: true,
            requireWrittenOverrideReason: true
        }
    }
};

module.exports = policyV5;
