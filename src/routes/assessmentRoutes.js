
const express = require("express");
const router = express.Router();
const { runAssessment } = require("../controllers/assessmentRunController");
const {
    getSummary,
    getDecisions,
    getPurchaseOrders
} = require("../controllers/assessmentController");

router.get("/summary", getSummary);
router.get("/decisions", getDecisions);
router.get("/purchase-orders", getPurchaseOrders);
router.post("/run", runAssessment);

module.exports = router;
