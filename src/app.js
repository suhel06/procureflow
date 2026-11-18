
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const purchaseRequestRoutes = require("./routes/purchaseRequestRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const contractRoutes = require("./routes/contractRoutes");
const supplierRoutes = require("./routes/supplierRoutes");


app.use(cors());
app.use(express.json());

app.use("/api/assessment", assessmentRoutes);
app.use("/api/purchase-requests", purchaseRequestRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/suppliers", supplierRoutes);

app.use(express.static(path.join(__dirname, "../public")));

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "ProcureFlow API is running!"
    });
});
app.use("/api/purchase-requests", purchaseRequestRoutes);
module.exports = app;
