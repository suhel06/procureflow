
const Policy = require("../models/Policy");

async function getActivePolicy(asOf = new Date()) {
    const policies = await Policy.find({
        is_active: true,
        effective_from: { $lte: asOf }
    })
        .sort({ effective_from: -1 })
        .lean();

    if (policies.length === 0) {
        throw new Error("No active procurement policy found");
    }

    if (policies.length > 1) {
        throw new Error(
            "Multiple active policies found. Please resolve policy configuration."
        );
    }

    const policy = policies[0];

    if (!policy.rules || !policy.version) {
        throw new Error("Active policy configuration is incomplete");
    }

    return policy;
}

module.exports = {
    getActivePolicy
};
