
const mongoose = require("mongoose");

const plantSchema = new mongoose.Schema({
    plant: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("Plant", plantSchema);
