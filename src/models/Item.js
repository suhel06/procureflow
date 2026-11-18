
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    item_code: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    uom: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    item_type: {
        type: String,
        required: true
    },
    standard_price: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model("Item", itemSchema);
    