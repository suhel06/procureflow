
const mongoose = require("mongoose");

const purchaseHistorySchema = new mongoose.Schema({
    po_number: {
        type: String,
        required: true
    },
    po_date: {
        type: Date,
        required: true
    },
    supplier_id: {
        type: String,
        required: true
    },
    item_code: {
        type: String,
        required: true
    },
    quantity: Number,
    uom: String,
    unit_price: Number,
    plant: String,
    
   delivered_on_time: Boolean
});

module.exports = mongoose.model(
    "PurchaseHistory",
    purchaseHistorySchema
);
