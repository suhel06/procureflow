
const PurchaseRequest = require("../models/PurchaseRequest");

async function getPurchaseRequests(req, res) {
    try {
        const requests = await PurchaseRequest.find({})
            .sort({ created_at: -1 })
            .lean();

        res.status(200).json({
            success: true,
            total: requests.length,
            requests
        });

    } catch (error) {
        console.error("Purchase request error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch purchase requests"
        });
    }
}

module.exports = {
    getPurchaseRequests
};
