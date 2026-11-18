
const express = require("express");
const router = express.Router();

const {
    getPurchaseRequests
} = require("../controllers/purchaseRequestController");

router.get("/", getPurchaseRequests);

module.exports = router;
