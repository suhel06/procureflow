
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");

const CONTRACT_DIR = path.join(
    __dirname,
    "../../data/contracts"
);

// Extract text and identify contract IDs
async function extractContractPdfs() {
    const files = fs.readdirSync(CONTRACT_DIR)
        .filter(file => file.toLowerCase().endsWith(".pdf"));

    const results = [];

    for (const file of files) {
        try {
            const filePath = path.join(CONTRACT_DIR, file);
            const buffer = fs.readFileSync(filePath);

            const data = await pdf(buffer);

            const text = data.text || "";

            const textMatch = text.match(/RC-\d{4}-\d+/);
            const filenameMatch = file.match(/RC-\d{4}-\d+/);

            const contractId = textMatch
                ? textMatch[0]
                : filenameMatch
                    ? filenameMatch[0]
                    : null;

            results.push({
                file,
                contract_id: contractId,
                id_source: textMatch
                    ? "PDF_TEXT"
                    : filenameMatch
                        ? "FILENAME_ONLY"
                        : "NOT_FOUND",
                text,
                text_length: text.length,
                pages: data.numpages,
                status: text.length > 0
                    ? "READABLE"
                    : "EMPTY_PDF"
            });

        } catch (error) {
            results.push({
                file,
                contract_id: null,
                status: "EXTRACTION_FAILED",
                error: error.message
            });
        }
    }

    return results;
}

// Compare extracted PDFs with MongoDB
async function comparePdfContracts(Contract, ContractLine) {
    const extracted = await extractContractPdfs();

    const registered = await Contract.find({}).lean();
    const allLines = await ContractLine.find({}).lean();

    const contractMap = new Map(
        registered.map(contract => [
            contract.contract_id,
            contract
        ])
    );

    const lineCountMap = new Map();

    for (const line of allLines) {
        lineCountMap.set(
            line.contract_id,
            (lineCountMap.get(line.contract_id) || 0) + 1
        );
    }

    const results = extracted.map(pdfFile => {
        const contract = contractMap.get(pdfFile.contract_id);

        const filenameId = pdfFile.file.match(/RC-\d{4}-\d+/);
        const filenameContractId = filenameId
            ? filenameId[0]
            : null;

        return {
            file: pdfFile.file,
            contract_id: pdfFile.contract_id,
            id_source: pdfFile.id_source,
            pdf_status: pdfFile.status,
            id_mismatch: Boolean(
                pdfFile.contract_id &&
                filenameContractId &&
                pdfFile.contract_id !== filenameContractId
            ),
            register_status: contract
                ? "REGISTERED"
                : "MISSING",
            supplier_id: contract?.supplier_id || "MISSING",
            contract_lines: pdfFile.contract_id
                ? lineCountMap.get(pdfFile.contract_id) || 0
                : 0,
            text: pdfFile.text || "",
            error: pdfFile.error || null
        };
    });

    return {
        results,
        total_pdfs: extracted.length,
        readable: extracted.filter(
            file => file.status === "READABLE"
        ).length,
        missing: results.filter(
            result => result.register_status === "MISSING"
        ).length,
        failed: extracted.filter(
            file => file.status === "EXTRACTION_FAILED"
        ).length
    };
}

module.exports = {
    extractContractPdfs,
    comparePdfContracts
};
