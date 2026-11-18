
const Contract = require("../models/Contract");
const ContractLine = require("../models/ContractLine");

// GET /api/contracts
// Fetch all contracts with their line-item counts
exports.getContracts = async (req, res) => {
    try {
        const contracts = await Contract.find({})
            .sort({ contract_id: 1 })
            .lean();

        const contractIds = contracts.map(c => c.contract_id);

        const lines = await ContractLine.find({
            contract_id: { $in: contractIds }
        }).lean();

        const lineCounts = {};

        lines.forEach(line => {
            lineCounts[line.contract_id] =
                (lineCounts[line.contract_id] || 0) + 1;
        });

        const result = contracts.map(contract => {
            const cap = Number(contract.value_cap || 0);
            const consumed = Number(contract.consumed_value || 0);

            return {
                ...contract,
                line_count: lineCounts[contract.contract_id] || 0,
                remaining_value: cap - consumed,
                utilization: cap > 0
                    ? Number(((consumed / cap) * 100).toFixed(2))
                    : 0
            };
        });

        res.status(200).json({
            success: true,
            total: result.length,
            contracts: result
        });

    } catch (error) {
        console.error("Contract fetch error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch contracts",
            error: error.message
        });
    }
};

// GET /api/contracts/:contractId
// Fetch one contract with all its line items
exports.getContractDetails = async (req, res) => {
    try {
        const contract = await Contract.findOne({
            contract_id: req.params.contractId
        }).lean();

        if (!contract) {
            return res.status(404).json({
                success: false,
                message: "Contract not found"
            });
        }

        const lines = await ContractLine.find({
            contract_id: contract.contract_id
        }).lean();

        const cap = Number(contract.value_cap || 0);
        const consumed = Number(contract.consumed_value || 0);

        res.status(200).json({
            success: true,
            contract: {
                ...contract,
                remaining_value: cap - consumed,
                utilization: cap > 0
                    ? Number(((consumed / cap) * 100).toFixed(2))
                    : 0
            },
            lines
        });

    } catch (error) {
        console.error("Contract details error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch contract details",
            error: error.message
        });
    }
};
