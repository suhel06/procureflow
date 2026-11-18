
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");

const PurchaseRequest = require("../models/PurchaseRequest");

const { matchItem } = require("../services/itemMatcher");
const { clubRequirements } = require("../services/prClubbing");
const { getActivePolicy } = require("../services/policyService");
const { evaluateRequirement } = require("../services/decisionEngine");
const {consolidatePurchaseOrders} = require("../services/poConsolidation");
const {exportAssessment} = require("../services/assessmentExporter");
async function runAssessment() {
    try {
        await connectDB();

        // 1. Load active procurement policy
        const policy = await getActivePolicy();

        console.log("\n========== PROCUREMENT ASSESSMENT ==========");
        console.log("Policy:", policy.policy_id);
        console.log("Version:", policy.version);

        // 2. Fetch PR lines chronologically
        const requests = await PurchaseRequest.find({})
            .sort({
                created_at: 1,
                pr_no: 1,
                pr_line: 1
            })
            .lean();

        const preparedLines = [];
        const excluded = [];

        // 3. Match purchase requests against item catalogue
        console.log("\nMatching purchase request items...");

        for (const request of requests) {
            const match = await matchItem(request);

            if (match.status === "matched") {
                preparedLines.push({
                    ...request,
                    resolved_item_code: match.item_code
                });

            } else if (match.status === "new_item") {
                preparedLines.push({
                    ...request,
                    resolved_item_code: "NEW"
                });

            } else {
                excluded.push({
                    pr_no: request.pr_no,
                    pr_line: request.pr_line,
                    description: request.description,
                    status: match.status
                });
            }
        }

        // 4. Club eligible purchase request lines
        const requirements = clubRequirements(preparedLines);

        // 5. Sort requirements chronologically
        requirements.sort((a, b) => {
            const dateDifference =
                new Date(a.first_created_at) -
                new Date(b.first_created_at);

            if (dateDifference !== 0) {
                return dateDifference;
            }

            return a.group_id.localeCompare(b.group_id);
        });

        // 6. Shared tracker for cumulative contract consumption
        const consumptionTracker = new Map();

        const decisions = [];
        const decisionErrors = [];

        // 7. Evaluate all requirements sequentially
        console.log("\nEvaluating procurement decisions...");

        for (const requirement of requirements) {
            try {
                const decision = await evaluateRequirement(
                    requirement,
                    policy,
                    consumptionTracker
                );

                decisions.push(decision);

            } catch (error) {
                decisionErrors.push({
                    group_id: requirement.group_id,
                    item_code: requirement.resolved_item_code,
                    error: error.message
                });

                decisions.push({
                    group_id: requirement.group_id,
                    item_code: requirement.resolved_item_code,
                    plant: requirement.plant,
                    decision: "MANUAL_REVIEW",
                    route: "ENGINE_ERROR",
                    reason: error.message,
                    policy_version: policy.version
                });
            }
        }
// 8. Consolidate eligible PO requirements
const consolidation = consolidatePurchaseOrders(
    requirements,
    decisions,
    24
);

console.log("\n========== PO CONSOLIDATION ==========");

console.log(
    "Total PO requirements:",
    consolidation.total_po_requirements
);

console.log(
    "Consolidated purchase orders:",
    consolidation.total_purchase_orders
);

console.log(
    "Total PO value:",
    consolidation.total_po_value
);

console.log("\nPurchase Order Summary:");

console.table(
    consolidation.purchaseOrders.map(po => ({
        po_number: po.po_number,
        supplier: po.supplier_id,
        plant: po.plant,
        route: po.route,
        contract: po.contract_id || "-",
        requirements: po.requirement_count,
        PRs: po.pr_count,
        lines: po.lines.length,
        value: po.total_value
    }))
);

console.log("\nSkipped PO requirements:");
console.table(consolidation.skipped);
        // 8. Generate decision summary
        const routeSummary = {};

        for (const decision of decisions) {
            const route = decision.route || "UNKNOWN";

            routeSummary[route] =
                (routeSummary[route] || 0) + 1;
        }

        const decisionSummary = {};

        for (const decision of decisions) {
            const type = decision.decision || "UNKNOWN";

            decisionSummary[type] =
                (decisionSummary[type] || 0) + 1;
        }
exportAssessment({
    decisions,
    requirements,
    consolidation,
    excluded,
    decisionErrors,
    policy
});
        // 9. Print assessment results
        console.log("\n========== ASSESSMENT SUMMARY ==========");

        console.log("Policy version:", policy.version);
        console.log("Total PR lines:", requests.length);
        console.log("Processed lines:", preparedLines.length);
        console.log("Excluded for review:", excluded.length);
        console.log("Total requirements:", requirements.length);
        console.log("Total decisions:", decisions.length);
        console.log("Decision errors:", decisionErrors.length);

        console.log("\nDecision breakdown:");
        console.table(
            Object.entries(decisionSummary).map(
                ([decision, count]) => ({
                    decision,
                    count
                })
            )
        );

        console.log("\nProcurement route breakdown:");
        console.table(
            Object.entries(routeSummary).map(
                ([route, count]) => ({
                    route,
                    count
                })
            )
        );

        console.log("\nFirst 20 procurement decisions:");

        console.table(
            decisions.slice(0, 20).map(decision => ({
                group_id: decision.group_id,
                item_code: decision.item_code,
                plant: decision.plant,
                decision: decision.decision,
                route: decision.route,
                supplier: decision.supplier_id || "-",
                contract: decision.contract_id || "-",
                value: decision.requirement_value,
                clause: decision.policy_clause
            }))
        );

        // 10. Print excluded requests and errors
        console.log("\nExcluded requests:");
        console.table(excluded);

        console.log("\nDecision engine errors:");
        console.table(decisionErrors);

        // 11. Show cumulative contract consumption
        console.log("\nContract consumption during this run:");

        console.table(
            [...consumptionTracker.entries()].map(
                ([contract_id, consumed_value]) => ({
                    contract_id,
                    consumed_value
                })
            )
        );

        console.log("\n========== ASSESSMENT COMPLETED ==========");

    } catch (error) {
        console.error("\nAssessment failed:", error);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
}

runAssessment();
