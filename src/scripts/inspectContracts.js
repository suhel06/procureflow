
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");

const CONTRACT_DIR = path.join(
    __dirname,
    "../../data/contracts"
);

async function inspectContracts() {
    try {
        const files = fs.readdirSync(CONTRACT_DIR)
            .filter(file => file.toLowerCase().endsWith(".pdf"));

        console.log(`Found ${files.length} PDF contracts\n`);

        for (const file of files) {
            const filePath = path.join(CONTRACT_DIR, file);
            const buffer = fs.readFileSync(filePath);

            const data = await pdf(buffer);

            console.log("\n================================");
            console.log("FILE:", file);
            console.log("================================");

            console.log(
                data.text.slice(0, 5000) ||
                "No readable text found"
            );
        }

    } catch (error) {
        console.error("PDF extraction failed:", error);
    }
}

inspectContracts();
