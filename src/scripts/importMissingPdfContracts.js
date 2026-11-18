
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");

const Contract = require("../models/Contract");
const ContractLine = require("../models/ContractLine");

const contracts = [
    {
        contract_id: "RC-2026-031",
        supplier_id: "S021",
        supplier_name: "Pneumatic Point",
        start_date: new Date("2026-11-15"),
        end_date: new Date("2027-11-14"),
        value_cap: 2000000,
        consumed_value: 0,
        lines: [
            {
                item_code: "ITM-1036",
                description: "Pneumatic cylinder 50x100",
                uom: "NOS",
                rate: 3537.76
            },
            {
                item_code: "ITM-1037",
                description: "Solenoid valve 5/2 1/4 inch",
                uom: "NOS",
                rate: 2439.01
            },
            {
                item_code: "ITM-1039",
                description: "FRL unit 1/2 inch",
                uom: "NOS",
                rate: 2746.87
            }
        ]
    },
    {
        contract_id: "RC-2026-033",
        supplier_id: "S035",
        supplier_name: "Infoline Systems",
        start_date: new Date("2026-11-20"),
        end_date: new Date("2027-11-19"),
        value_cap: 5000000,
        consumed_value: 0,
        lines: [
            {
                item_code: "ITM-1056",
                description: "Laptop i5 16GB 512GB",
                uom: "NOS",
                rate: 64654.36
            },
            {
                item_code: "ITM-1057",
                description: "24 inch monitor",
                uom: "NOS",
                rate: 10689.51
            }
        ]
    }
];

async function importContracts() {
    try {
        await connectDB();

        for (const contract of contracts) {
            const { lines, ...contractData } = contract;

            await Contract.updateOne(
                { contract_id: contractData.contract_id },
                { $set: contractData },
                { upsert: true }
            );

            for (const line of lines) {
                await ContractLine.updateOne(
                    {
                        contract_id: contractData.contract_id,
                        item_code: line.item_code
                    },
                    { $set: { ...line, contract_id: contractData.contract_id } },
                    { upsert: true }
                );
            }

            console.log(
                `${contractData.contract_id}: imported ${lines.length} lines`
            );
        }

        console.log("\nPDF contract import completed!");

    } catch (error) {
        console.error("Import failed:", error);
    } finally {
        await mongoose.disconnect();
    }
}

importContracts();
