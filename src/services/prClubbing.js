
function getCalendarDayDifference(date1, date2) {
    const first = new Date(date1);
    const second = new Date(date2);

    const firstDay = Date.UTC(
        first.getUTCFullYear(),
        first.getUTCMonth(),
        first.getUTCDate()
    );

    const secondDay = Date.UTC(
        second.getUTCFullYear(),
        second.getUTCMonth(),
        second.getUTCDate()
    );

    return Math.abs((secondDay - firstDay) / 86400000);
}

function comparePRLines(a, b) {
    const timeDifference =
        new Date(a.created_at) - new Date(b.created_at);

    if (timeDifference !== 0) return timeDifference;

    const prDifference = a.pr_no.localeCompare(b.pr_no);

    if (prDifference !== 0) return prDifference;

    return Number(a.pr_line) - Number(b.pr_line);
}

function clubRequirements(lines) {
    const sortedLines = [...lines].sort(comparePRLines);

    const requirements = [];

    for (const line of sortedLines) {

        // New items must never be clubbed.
        if (
            !line.resolved_item_code ||
            line.resolved_item_code === "NEW"
        ) {
            requirements.push({
                group_id: `REQ-${requirements.length + 1}`,
                lines: [line],
                first_created_at: line.created_at,
                first_need_by_date: line.need_by_date,
                resolved_item_code: "NEW",
                plant: line.plant,
                is_emergency: line.urgency === "Emergency"
            });

            continue;
        }

        // Find the earliest eligible existing requirement.
        const eligibleRequirement = requirements.find(req => {

            if (
                req.resolved_item_code !== line.resolved_item_code ||
                req.plant !== line.plant ||
                req.resolved_item_code === "NEW"
            ) {
                return false;
            }

            const creationDifference =
                getCalendarDayDifference(
                    req.first_created_at,
                    line.created_at
                );

            const needByDifference =
                getCalendarDayDifference(
                    req.first_need_by_date,
                    line.need_by_date
                );

            return (
                creationDifference <= 14 &&
                needByDifference <= 7
            );
        });

        if (eligibleRequirement) {
            eligibleRequirement.lines.push(line);

            if (line.urgency === "Emergency") {
                eligibleRequirement.is_emergency = true;
            }

        } else {
            requirements.push({
                group_id: `REQ-${requirements.length + 1}`,
                lines: [line],
                first_created_at: line.created_at,
                first_need_by_date: line.need_by_date,
                resolved_item_code: line.resolved_item_code,
                plant: line.plant,
                is_emergency: line.urgency === "Emergency"
            });
        }
    }

    return requirements.map(requirement => ({
        ...requirement,
        total_quantity: requirement.lines.reduce(
            (sum, line) => sum + Number(line.quantity || 0),
            0
        )
    }));
}

module.exports = {
    clubRequirements,
    getCalendarDayDifference
};
