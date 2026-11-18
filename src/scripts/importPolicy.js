
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");

const Policy = require("../models/Policy");
const policyV5 = require("../config/policyV5");

async function importPolicy() {
    try {
        await connectDB();

        // Insert or update the policy as inactive first
        const policy = await Policy.findOneAndUpdate(
            {
                policy_id: policyV5.policy_id,
                version: policyV5.version
            },
            {
                $set: {
                    ...policyV5,
                    is_active: false
                }
            },
            {
                upsert: true,
                returnDocument: "after",
                runValidators: true
            }
        );

        // Deactivate all other policy versions
        await Policy.updateMany(
            { _id: { $ne: policy._id } },
            { $set: { is_active: false } }
        );

        // Activate the imported version
        policy.is_active = true;
        await policy.save();

        console.log("\nPolicy imported successfully!");
        console.log("Policy ID:", policy.policy_id);
        console.log("Version:", policy.version);
        console.log("Active:", policy.is_active);

    } catch (error) {
        console.error("Policy import failed:", error.message);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
}

importPolicy();
