
const mongoose = require("mongoose");

const contractLineSchema = new mongoose.Schema({
    contract_id: {
        type: String,
        required: true
    },
    item_code: {
        type: String,
        required: true
    },
    description: String,
    uom: String,
    rate: Number
});

module.exports = mongoose.model(
    "ContractLine",
    contractLineSchema
);
