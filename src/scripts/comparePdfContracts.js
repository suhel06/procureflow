
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");

const Contract = require("../models/Contract");
const ContractLine = require("../models/ContractLine");

const {
    comparePdfContracts
} = require("../services/contractPdfService");

async function run() {
    try {
        await connectDB();

        const report = await comparePdfContracts(
            Contract,
            ContractLine
        );

        console.log("\nPDF CONTRACT REPORT");
        console.table(
            report.results.map(({ text, ...row }) => row)
        );

        console.log("\nSUMMARY");
        console.log("Total PDFs:", report.total_pdfs);
        console.log("Readable:", report.readable);
        console.log("Missing:", report.missing);
        console.log("Failed:", report.failed);

    } catch (error) {
        console.error("Comparison failed:", error);
    } finally {
        await mongoose.disconnect();
    }
}

run();
