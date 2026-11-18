
const mongoose = require("mongoose");

const policySchema = new mongoose.Schema({
    policy_id: {
        type: String,
        required: true
    },

    version: {
        type: String,
        required: true
    },

    effective_from: {
        type: Date,
        required: true
    },

    is_active: {
        type: Boolean,
        default: false
    },

    description: String,

    rules: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }

}, {
    timestamps: true
});

policySchema.index(
    { policy_id: 1, version: 1 },
    { unique: true }
);

module.exports = mongoose.model("Policy", policySchema);
