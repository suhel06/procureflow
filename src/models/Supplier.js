
const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema({
    supplier_id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    city: String,
    categories: String,
    status: String,
    on_time_pct: Number,
    quality_rating: Number
});

module.exports = mongoose.model("Supplier", supplierSchema);
