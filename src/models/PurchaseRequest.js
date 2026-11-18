
const mongoose = require("mongoose");

const purchaseRequestSchema = new mongoose.Schema({
    pr_no: {
        type: String,
        required: true
    },
    pr_line: {
        type: Number,
        required: true
    },
    created_at: Date,
    requester: String,
    department: String,
    plant: String,
    item_code: String,
    description: String,
    quantity: Number,
    uom: String,
    estimated_unit_price: Number,
    need_by_date: Date,
    urgency: String
});

purchaseRequestSchema.index(
    { pr_no: 1, pr_line: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "PurchaseRequest",
    purchaseRequestSchema
);
