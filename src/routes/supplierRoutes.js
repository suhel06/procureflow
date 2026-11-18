
const express = require("express");
const router = express.Router();

const {
    getSuppliers,
    getSupplierDetails
} = require("../controllers/supplierController");

router.get("/", getSuppliers);
router.get("/:supplierId", getSupplierDetails);

module.exports = router;
