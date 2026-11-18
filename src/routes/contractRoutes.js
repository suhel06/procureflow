
const express = require("express");
const router = express.Router();

const {
    getContracts,
    getContractDetails
} = require("../controllers/contractController");

router.get("/", getContracts);
router.get("/:contractId", getContractDetails);

module.exports = router;
