
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "../../output");

function escapeCSV(value) {
    if (value === null || value === undefined) return "";

    return `"${String(value).replace(/"/g, '""')}"`;
}

function writeCSV(filename, rows, columns) {
    const content = [
        columns.join(","),
        ...rows.map(row =>
            columns.map(column => escapeCSV(row[column])).join(",")
        )
    ].join("\n");

    fs.writeFileSync(
        path.join(OUTPUT_DIR, filename),
        "\uFEFF" + content,
        "utf8"
    );
}

function exportAssessment({
    decisions,
    requirements,
    consolidation,
    excluded,
    decisionErrors,
    policy
}) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const decisionMap = new Map(
        decisions.map(d => [d.group_id, d])
    );

    const poMap = new Map();

    for (const po of consolidation.purchaseOrders) {
        for (const line of po.lines) {
            poMap.set(line.group_id, po.po_number);
        }
    }

    // One output row per original PR line.
    const decisionRows = [];

    for (const requirement of requirements) {
        const decision = decisionMap.get(requirement.group_id);

        for (const line of requirement.lines) {
            decisionRows.push({
                pr_no: line.pr_no,
                pr_line: line.pr_line,
                resolved_item_code: requirement.resolved_item_code,
                group_id: requirement.group_id,
                po_id: poMap.get(requirement.group_id) || "",
                decision: decision?.decision || "MANUAL_REVIEW",
                route: decision?.route || "ENGINE_ERROR",
                supplier_id: decision?.supplier_id || "",
                unit_price: decision?.unit_price ?? "",
                group_value_inr: decision?.requirement_value ?? "",
                suggested_supplier_ids: (decision?.suppliers || [])
                    .map(s => s.supplier_id)
                    .join(";"),
                policy_version: decision?.policy_version || policy.version,
                reason: decision?.reason || "Decision unavailable"
            });
        }
    }

    for (const item of excluded) {
        decisionRows.push({
            pr_no: item.pr_no,
            pr_line: item.pr_line,
            resolved_item_code: "NEW",
            group_id: "",
            po_id: "",
            decision: "NOT_PROCESSED",
            route: "NOT_PROCESSED",
            supplier_id: "",
            unit_price: "",
            group_value_inr: "",
            suggested_supplier_ids: "",
            policy_version: policy.version,
            reason: item.status || "Excluded for manual review"
        });
    }

    writeCSV("assessment_decisions.csv", decisionRows, [
        "pr_no",
        "pr_line",
        "resolved_item_code",
        "group_id",
        "po_id",
        "decision",
        "route",
        "supplier_id",
        "unit_price",
        "group_value_inr",
        "suggested_supplier_ids",
        "policy_version",
        "reason"
    ]);

    // Purchase order CSV.
    const poRows = consolidation.purchaseOrders.flatMap(po =>
        po.lines.map(line => ({
            po_number: po.po_number,
            supplier_id: po.supplier_id,
            supplier_name: po.supplier_name,
            plant: po.plant,
            route: po.route,
            contract_id: po.contract_id,
            pr_no: line.pr_no,
            pr_line: line.pr_line,
            group_id: line.group_id,
            item_code: line.item_code,
            description: line.description,
            quantity: line.quantity,
            uom: line.uom,
            unit_price: line.unit_price,
            line_value: line.line_value,
            po_total_value: po.total_value
        }))
    );

    writeCSV("purchase_orders.csv", poRows, [
        "po_number",
        "supplier_id",
        "supplier_name",
        "plant",
        "route",
        "contract_id",
        "pr_no",
        "pr_line",
        "group_id",
        "item_code",
        "description",
        "quantity",
        "uom",
        "unit_price",
        "line_value",
        "po_total_value"
    ]);

    const report = {
        generated_at: new Date().toISOString(),
        policy: {
            policy_id: policy.policy_id,
            version: policy.version
        },
        summary: {
            total_decisions: decisions.length,
            total_decision_lines: decisionRows.length,
            total_purchase_orders: consolidation.total_purchase_orders,
            total_po_requirements: consolidation.total_po_requirements,
            total_po_value: consolidation.total_po_value,
            excluded_requests: excluded.length,
            decision_errors: decisionErrors.length
        },
        decisions,
        requirements,
        purchase_orders: consolidation.purchaseOrders,
        excluded,
        decision_errors: decisionErrors
    };

    fs.writeFileSync(
        path.join(OUTPUT_DIR, "assessment_report.json"),
        JSON.stringify(report, null, 2),
        "utf8"
    );

    console.log("Assessment files exported successfully!");
    console.log("1. assessment_decisions.csv");
    console.log("2. purchase_orders.csv");
    console.log("3. assessment_report.json");
}

module.exports = { exportAssessment };
