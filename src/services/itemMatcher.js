
const Item = require("../models/Item");

// Expand common procurement abbreviations

function normalizeDescription(description) {
    const aliases = {
        hyd: "hydraulic",
        brg: "bearing",
        bkt: "bucket",
        pneu: "pneumatic"
    };

    return String(description || "")
        .toLowerCase()
        .replace(/\bas per sample\b/g, " ")
        .replace(/\bfor maintenance\b/g, " ")
        .replace(/[^a-z0-9./-]/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .map(word => aliases[word] || word)
        .join(" ")
        .replace(/[-/]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}


// Calculate how many request words match an item's words
function calculateMatchScore(requestDescription, itemDescription) {
    const requestWords = new Set(
        normalizeDescription(requestDescription).split(" ")
    );

    const itemWords = new Set(
        normalizeDescription(itemDescription).split(" ")
    );

    if (requestWords.size === 0 || itemWords.size === 0) {
        return 0;
    }

    let matchedWords = 0;

    for (const word of requestWords) {
        if (itemWords.has(word)) {
            matchedWords++;
        }
    }

    return matchedWords / requestWords.size;
}

// Main item matching function
async function matchItem(request) {
    // Case 1: Requester provided an item code
    if (request.item_code && request.item_code.trim()) {
        const item = await Item.findOne({
            item_code: request.item_code.trim()
        }).lean();

        if (!item) {
            return {
                status: "invalid_item_code",
                message: "Provided item code was not found"
            };
        }

        return {
            status: "matched",
            item_code: item.item_code,
            item,
            match_type: "exact_code",
            score: 1
        };
    }

    // Case 2: Match using description
    const items = await Item.find({}).lean();

    const candidates = items.map(item => ({
        item,
        score: calculateMatchScore(
            request.description,
            item.description
        )
    }));

    candidates.sort((a, b) => b.score - a.score);

    const best = candidates[0];
    const secondBest = candidates[1];

    // No sufficiently strong match
    
if (!best || best.score === 0) {
    return {
        status: "new_item",
        route: "NEW_ITEM_SOURCING",
        message: "No catalogue match found"
    };
}

if (best.score < 0.75) {
    return {
        status: "manual_review",
        message: "Possible catalogue match requires verification",
        candidates: candidates.slice(0, 3).map(candidate => ({
            item_code: candidate.item.item_code,
            description: candidate.item.description,
            score: candidate.score
        }))
    };
}


    // Avoid automatically choosing between similar candidates
    if (
        secondBest &&
        best.score - secondBest.score < 0.10
    ) {
        return {
            status: "ambiguous",
            message: "Multiple item matches have similar scores",
            candidates: candidates.slice(0, 3).map(candidate => ({
                item_code: candidate.item.item_code,
                description: candidate.item.description,
                score: candidate.score
            }))
        };
    }

    return {
        status: "matched",
        item_code: best.item.item_code,
        item: best.item,
        match_type: "description",
        score: best.score
    };
}

module.exports = {
    matchItem,
    normalizeDescription,
    calculateMatchScore
};
