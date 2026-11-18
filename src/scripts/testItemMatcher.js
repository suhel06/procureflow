
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const { matchItem } = require("../services/itemMatcher");

async function testMatcher() {
    try {
        await connectDB();

        const tests = [
            {
                description: "hyd hose 1/2 inch 2 wire"
            },
            {
                description: "brg 6205 2rs"
            },
            {
                description: "Drinking water purifier 50 LPH"
            },
            {
                item_code: "ITM-1001",
                description: "Some different description"
            }
        ];

        for (const test of tests) {
            const result = await matchItem(test);

            console.log("\nInput:", test);
            console.log("Result:", result.status);
            console.log("Matched item:", result.item_code || "None");
            console.log("Details:", result.message || result.match_type);
        }

    } catch (error) {
        console.error("Test failed:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

testMatcher();
