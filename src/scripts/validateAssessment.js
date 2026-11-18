
const fs = require("fs");
const path = require("path");

const reportPath = path.join(
    __dirname,
    "../../output/assessment_report.json"
);

function validateAssessment() {
    if (!fs.existsSync(reportPath)) {
        throw new Error("Assessment report not found. Run assessment first.");
    }

    const report = JSON.parse(
        fs.readFileSync(reportPath, "utf8")
    );

    const decisions = report.decisions || [];
    const purchaseOrders = report.purchase_orders || [];

    const poDecisions = decisions.filter(
        d => d.decision === "PO"
    );

    const poGroups = new Set(
        poDecisions.map(d => d.group_id)
    );

    const consolidatedGroups = new Set(
        purchaseOrders.flatMap(po =>
            po.lines.map(line => line.group_id)
        )
    );

    const missingGroups = [...poGroups].filter(
        id => !consolidatedGroups.has(id)
    );

    const totalDecisionValue = poDecisions.reduce(
        (sum, d) => sum + Number(d.requirement_value || 0),
        0
    );

    const totalPOValue = purchaseOrders.reduce(
        (sum, po) => sum + Number(po.total_value || 0),
        0
    );

    const invalidPOs = purchaseOrders.filter(po => {
        const lineValue = po.lines.reduce(
            (sum, line) => sum + Number(line.line_value || 0),
            0
        );

        return (
            !po.supplier_id ||
            !po.plant ||
            !po.lines.length ||
            Math.abs(lineValue - po.total_value) > 0.02
        );
    });

    const duplicatePOs = purchaseOrders
        .map(po => po.po_number)
        .filter((number, index, array) =>
            array.indexOf(number) !== index
        );

    const checks = [
        {
            check: "Decision count",
            result: decisions.length === report.summary.total_decisions
        },
        {
            check: "PO requirement coverage",
            result: missingGroups.length === 0
        },
        {
            check: "PO value reconciliation",
            result: Math.abs(totalDecisionValue - totalPOValue) < 0.02
        },
        {
            check: "PO line value validation",
            result: invalidPOs.length === 0
        },
        {
            check: "Unique PO numbers",
            result: duplicatePOs.length === 0
        },
        {
            check: "Decision errors",
            result: (report.decision_errors || []).length === 0
        }
    ];

    console.log("\n========== FINAL VALIDATION ==========");

    console.table(checks.map(check => ({
        check: check.check,
        status: check.result ? "PASS" : "FAIL"
    })));

    console.log("\nTotal decisions:", decisions.length);
    console.log("PO decisions:", poDecisions.length);
    console.log("Draft POs:", purchaseOrders.length);
    console.log("PO decision value:", totalDecisionValue.toFixed(2));
    console.log("Consolidated PO value:", totalPOValue.toFixed(2));

    if (missingGroups.length) {
        console.log("Missing PO groups:", missingGroups);
    }

    if (invalidPOs.length) {
        console.log("Invalid POs:", invalidPOs.map(po => po.po_number));
    }

    const passed = checks.every(check => check.result);

    console.log(
        "\nFINAL RESULT:",
        passed ? "ALL CHECKS PASSED" : "VALIDATION FAILED"
    );

    if (!passed) {
        process.exitCode = 1;
    }
}

try {
    validateAssessment();
} catch (error) {
    console.error("Validation failed:", error.message);
    process.exitCode = 1;
}
