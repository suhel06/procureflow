
const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema({
    contract_id: {
        type: String,
        required: true,
        unique: true
    },
    supplier_id: {
        type: String,
        required: true
    },
    supplier_name: String,
    start_date: Date,
    end_date: Date,
    value_cap: Number,
    consumed_value: Number
});

module.exports = mongoose.model("Contract", contractSchema);
