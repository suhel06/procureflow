
const { clubRequirements } = require("../services/prClubbing");

const testLines = [
    {
        pr_no: "PR-26-00146",
        pr_line: 1,
        created_at: "2026-11-02T09:40:00",
        plant: "CHK1",
        resolved_item_code: "ITM-1038",
        quantity: 270,
        need_by_date: "2026-11-19",
        urgency: "Normal"
    },
    {
        pr_no: "PR-26-00144",
        pr_line: 1,
        created_at: "2026-11-03T09:30:00",
        plant: "CHK1",
        resolved_item_code: "ITM-1038",
        quantity: 190,
        need_by_date: "2026-11-15",
        urgency: "Normal"
    },
    {
        pr_no: "PR-26-00145",
        pr_line: 1,
        created_at: "2026-11-05T08:40:00",
        plant: "CHK1",
        resolved_item_code: "ITM-1038",
        quantity: 300,
        need_by_date: "2026-11-21",
        urgency: "Normal"
    }
];

const result = clubRequirements(testLines);

console.log("Clubbing result:");

console.log(JSON.stringify(result, null, 2));

console.log("\nTotal requirements:", result.length);
console.log("Combined quantity:", result[0].total_quantity);
