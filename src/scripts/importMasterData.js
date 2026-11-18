
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Papa = require("papaparse");

require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const connectDB = require("../config/db");

const Item = require("../models/Item");
const Supplier = require("../models/Supplier");
const Plant = require("../models/Plant");
const PurchaseHistory = require("../models/PurchaseHistory");
const Contract = require("../models/Contract");
const ContractLine = require("../models/ContractLine");
const PurchaseRequest = require("../models/PurchaseRequest");
const DATA_DIR = path.join(__dirname, "../../data/source");

// Read and parse a CSV file
function readCSV(filename) {
    const filePath = path.join(DATA_DIR, filename);

    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filename}`);
    }

    const fileContent = fs.readFileSync(filePath, "utf8");

    const result = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: header => header.trim()
    });

    if (result.errors.length > 0) {
        throw new Error(
            `CSV error in ${filename}: ${result.errors[0].message}`
        );
    }

    return result.data;
}

// Convert a value into a number
function toNumber(value) {
    if (value === undefined || value === null || value.trim() === "") {
        return null;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        throw new Error(`Invalid number: ${value}`);
    }

    return number;
}
function toBoolean(value) {
    return String(value).trim().toLowerCase() === "true";
}

// Import one collection
async function importCollection(Model, filename, transform) {
    const rows = readCSV(filename);
    const documents = rows.map(transform);

    await Model.deleteMany({});
    await Model.insertMany(documents);

    console.log(
        `${filename}: ${documents.length} records imported`
    );
}

// Main import function
async function importData() {
    try {
        await connectDB();

        console.log("\nStarting master data import...\n");

        await importCollection(Item, "item_master.csv", row => ({
            item_code: row.item_code,
            description: row.description,
            uom: row.uom,
            category: row.category,
            item_type: row.item_type,
            standard_price: toNumber(row.standard_price)
        }));

        await importCollection(Supplier, "supplier_master.csv", row => ({
            supplier_id: row.supplier_id,
            name: row.name,
            city: row.city,
            categories: row.categories,
            status: row.status,
            on_time_pct: toNumber(row.on_time_pct),
            quality_rating: toNumber(row.quality_rating)
        }));

        await importCollection(Plant, "plants.csv", row => ({
            plant: row.plant,
            name: row.name
        }));

        await importCollection(PurchaseHistory, "po_history.csv", row => ({
            po_number: row.po_number,
            po_date: row.po_date,
            supplier_id: row.supplier_id,
            item_code: row.item_code,
            quantity: toNumber(row.quantity),
            uom: row.uom,
            unit_price: toNumber(row.unit_price),
            plant: row.plant,
            delivered_on_time: toBoolean(row.delivered_on_time)
        }));

        await importCollection(Contract, "contract_register.csv", row => ({
            contract_id: row.contract_id,
            supplier_id: row.supplier_id,
            supplier_name: row.supplier_name,
            start_date: row.start_date,
            end_date: row.end_date,
            value_cap: toNumber(row.value_cap),
            consumed_value: toNumber(row.consumed_value)
        }));

        await importCollection(ContractLine, "contract_lines.csv", row => ({
            contract_id: row.contract_id,
            item_code: row.item_code,
            description: row.description,
            uom: row.uom,
            rate: toNumber(row.rate)
        }));

await importCollection(
    PurchaseRequest,
    "sample_pr_batch.csv",
    row => ({
        pr_no: row.pr_no,
        pr_line: toNumber(row.pr_line),
        created_at: new Date(row.created_at.replace(" ", "T")),
        requester: row.requester,
        department: row.department,
        plant: row.plant,
        item_code: row.item_code || null,
        description: row.description,
        quantity: toNumber(row.quantity),
        uom: row.uom,
        estimated_unit_price: toNumber(row.estimated_unit_price),
        need_by_date: row.need_by_date
            ? new Date(row.need_by_date)
            : null,
        urgency: row.urgency
    })
);

        console.log("\nAll master data imported successfully!");

    } catch (error) {
        console.error("\nImport failed:", error.message);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
}

importData();
