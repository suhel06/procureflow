
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");

const Item = require("../models/Item");
const PurchaseRequest = require("../models/PurchaseRequest");

const {
    calculateMatchScore
} = require("../services/itemMatcher");

async function inspectUnmatched() {
    try {
        await connectDB();

        const requests = await PurchaseRequest.find({}).lean();
        const items = await Item.find({}).lean();

        const unmatched = [
            "PR-26-00004",
            "PR-26-00036",
            "PR-26-00042",
            "PR-26-00075",
            "PR-26-00119",
            "PR-26-00170",
            "PR-26-00171"
        ];

        for (const prNo of unmatched) {
            const request = requests.find(
                pr => pr.pr_no === prNo
            );

            if (!request) continue;

            const candidates = items.map(item => ({
                item_code: item.item_code,
                description: item.description,
                score: calculateMatchScore(
                    request.description,
                    item.description
                )
            }));

            candidates.sort((a, b) => b.score - a.score);

            console.log("\n--------------------------------");
            console.log("PR:", prNo);
            console.log("Description:", request.description);
            console.log("Top 3 catalogue candidates:");

            console.table(candidates.slice(0, 3));
        }

    } catch (error) {
        console.error("Inspection failed:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

inspectUnmatched();
