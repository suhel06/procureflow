poConsolidation.js
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");

const PurchaseRequest = require("../models/PurchaseRequest");
const { matchItem } = require("../services/itemMatcher");

async function testAllPRs() {
    try {
        await connectDB();

        const requests = await PurchaseRequest.find({}).lean();

        const counts = {
            matched: 0,
            new_item: 0,
            ambiguous: 0,
            invalid_item_code: 0
        };

        const results = [];
        const unmatchedRequests = [];

        for (const request of requests) {
            const result = await matchItem(request);
            if (result.status !== "matched") {
    unmatchedRequests.push({
        pr_no: request.pr_no,
        description: request.description,
        status: result.status,
        message: result.message
    });
}

            counts[result.status]++;

            results.push({
                pr_no: request.pr_no,
                pr_line: request.pr_line,
                description: request.description,
                status: result.status,
                item_code: result.item_code || "N/A",
                score: result.score ?? "N/A"
            });
        }

        console.table(counts);

        console.log("\nTotal requests:", requests.length);

        console.log("\nFirst 20 matching results:");
        console.table(results.slice(0, 20));
        console.log("\nUnmatched requests:");

console.table(unmatchedRequests);

    } catch (error) {
        console.error("Batch test failed:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

testAllPRs();
