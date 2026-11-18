
    const fs = require("fs");
    const path = require("path");

    const reportPath = path.join(
        __dirname,
        "../../output/assessment_report.json"
    );

    function getReport() {
        if (!fs.existsSync(reportPath)) {
            throw new Error("Assessment report not found.");
        }

        return JSON.parse(fs.readFileSync(reportPath, "utf8"));
    }

    // Dashboard KPIs and chart data
    exports.getSummary = (req, res) => {
        try {
            const report = getReport();
            const summary = report.summary;
            const decisions = report.decisions || [];

            const decisionBreakdown = {};
            const routeBreakdown = {};

            decisions.forEach(d => {
                decisionBreakdown[d.decision] =
                    (decisionBreakdown[d.decision] || 0) + 1;

                routeBreakdown[d.route] =
                    (routeBreakdown[d.route] || 0) + 1;
            });

            res.json({
                success: true,
                generated_at: report.generated_at,
                policy: report.policy,
                summary,
                decision_breakdown: decisionBreakdown,
                route_breakdown: routeBreakdown
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

    // All procurement decisions
    exports.getDecisions = (req, res) => {
        try {
            const report = getReport();

            res.json({
                success: true,
                total: report.decisions.length,
                decisions: report.decisions
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

    // Consolidated purchase orders
    exports.getPurchaseOrders = (req, res) => {
        try {
            const report = getReport();

            res.json({
                success: true,
                total: report.purchase_orders.length,
                purchase_orders: report.purchase_orders
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };
