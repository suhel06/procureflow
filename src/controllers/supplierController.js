
const Supplier = require("../models/Supplier");

// GET /api/suppliers
exports.getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find({})
            .sort({ name: 1 })
            .lean();

        const result = suppliers.map(supplier => ({
            ...supplier,
            on_time_pct: Number(supplier.on_time_pct || 0),
            quality_rating: Number(supplier.quality_rating || 0)
        }));

        res.status(200).json({
            success: true,
            total: result.length,
            suppliers: result
        });

    } catch (error) {
        console.error("Supplier fetch error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch suppliers",
            error: error.message
        });
    }
};

// GET /api/suppliers/:supplierId
exports.getSupplierDetails = async (req, res) => {
    try {
        const supplier = await Supplier.findOne({
            supplier_id: req.params.supplierId
        }).lean();

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found"
            });
        }

        res.status(200).json({
            success: true,
            supplier
        });

    } catch (error) {
        console.error("Supplier details error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch supplier details",
            error: error.message
        });
    }
};
