
function consolidatePurchaseOrders(
    requirements,
    decisions,
    windowHours = 24
) {
    const requirementMap = new Map(
        requirements.map(req => [req.group_id, req])
    );

    const windowMs = windowHours * 60 * 60 * 1000;

    const eligible = [];
    const skipped = [];

    for (const decision of decisions) {
        if (decision.decision !== "PO") continue;

        const requirement = requirementMap.get(
            decision.group_id
        );

        if (!requirement || !decision.supplier_id) {
            skipped.push({
                group_id: decision.group_id,
                reason: "Missing requirement or supplier"
            });
            continue;
        }

        eligible.push({
            decision,
            requirement,
            date: new Date(requirement.first_created_at)
        });
    }

    eligible.sort((a, b) => a.date - b.date);

    const groups = new Map();

    for (const entry of eligible) {
        const { decision, date } = entry;

        const baseKey = [
            decision.supplier_id,
            decision.plant,
            decision.route,
            decision.contract_id || "NO_CONTRACT"
        ].join("|");

        if (!groups.has(baseKey)) {
            groups.set(baseKey, []);
        }

        const buckets = groups.get(baseKey);

        // Find an existing PO within the 24-hour window.
        let bucket = buckets.find(existing =>
            date - existing.startDate <= windowMs
        );

        if (!bucket) {
            bucket = {
                startDate: date,
                entries: []
            };

            buckets.push(bucket);
        }

        bucket.entries.push(entry);
    }

    const purchaseOrders = [];
    let counter = 1;

    for (const [baseKey, buckets] of groups) {
        for (const bucket of buckets) {
            const entries = bucket.entries;

            const first = entries[0].decision;

            const poLines = [];

            for (const entry of entries) {
                const { decision, requirement } = entry;

                for (const line of requirement.lines) {
                    poLines.push({
                        group_id: requirement.group_id,
                        pr_no: line.pr_no,
                        pr_line: line.pr_line,
                        item_code: decision.item_code,
                        description: line.description,
                        quantity: Number(line.quantity || 0),
                        uom: line.uom,
                        unit_price: decision.unit_price,
                        line_value:
                            Number(line.quantity || 0) *
                            Number(decision.unit_price || 0)
                    });
                }
            }

            const totalValue = entries.reduce(
                (sum, entry) =>
                    sum + Number(
                        entry.decision.requirement_value || 0
                    ),
                0
            );

            const lastDate = entries.reduce(
                (latest, entry) =>
                    entry.date > latest ? entry.date : latest,
                bucket.startDate
            );

            const prNumbers = [
                ...new Set(
                    poLines.map(line => line.pr_no)
                )
            ];

            purchaseOrders.push({
                po_number: `DRAFT-PO-${String(counter).padStart(4, "0")}`,

                supplier_id: first.supplier_id,
                supplier_name: first.supplier_name || null,

                plant: first.plant,
                route: first.route,
                contract_id: first.contract_id || null,

                requirement_count: entries.length,
                pr_count: prNumbers.length,

                pr_numbers: prNumbers,

                window_start: bucket.startDate,
                window_end: lastDate,

                total_quantity: poLines.reduce(
                    (sum, line) => sum + line.quantity,
                    0
                ),

                total_value: Number(totalValue.toFixed(2)),

                lines: poLines
            });

            counter++;
        }
    }

    return {
        purchaseOrders,
        skipped,
        total_purchase_orders: purchaseOrders.length,
        total_po_requirements: eligible.length,
        total_po_value: Number(
            purchaseOrders.reduce(
                (sum, po) => sum + po.total_value,
                0
            ).toFixed(2)
        )
    };
}

module.exports = {
    consolidatePurchaseOrders
};
