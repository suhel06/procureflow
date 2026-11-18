# Procurement Decision Assumptions

This document records implementation decisions and assumptions made while developing ProcureFlow for the Corvo Engineering procurement assessment.

The decisions below describe the current implementation. They should be reviewed against the official Procurement Policy v5.0 and any future amendments.

## 1. Item Matching

1. Exact item-code matching takes priority.
2. Common procurement abbreviations are normalized.
3. Non-essential phrases such as "as per sample" are removed before description comparison.
4. Strong description similarity is required for automatic matching.
5. Partial matches are sent for manual review.
6. Similar catalogue candidates are not selected automatically without sufficient confidence.
7. Items without a catalogue match are treated as new-item candidates.
8. Technical specification differences must be verified before treating items as equivalent.

### Matching Thresholds

- Automatic match: 0.75 or above.
- Manual review: greater than 0 and below 0.75.
- No match: 0.

## 2. Purchase Request Clubbing

PR lines are processed chronologically using:

- Creation timestamp.
- PR number.
- PR line number.

Existing catalogue items are eligible for clubbing when:

1. Their resolved item codes match.
2. Their plants match.
3. Their creation dates are within 14 calendar days.
4. Their need-by dates are within 7 calendar days.

Additional decisions:

- A new-item requirement is never clubbed with another requirement.
- A line is compared against the earliest eligible existing requirement.
- The group's first creation date and first need-by date remain the reference dates.
- Quantities are summed across all lines in a requirement.
- If any line in a requirement has Emergency urgency, the entire requirement is marked as emergency.

The current implementation uses hardcoded 14-day and 7-day clubbing windows. Although these values also exist in the policy configuration, the clubbing service does not currently read them dynamically.

## 3. Plant Validation

The decision engine validates the requirement's plant against the active policy scope.

A requirement associated with a plant outside the configured scope receives:

- Decision: `MANUAL_REVIEW`
- Route: `INVALID_PLANT`

This prevents unsupported plants from automatically receiving procurement decisions.

## 4. New-Item Handling

Items without an existing catalogue match are treated as new-item candidates.

Decisions:

- New items are not clubbed.
- New items are routed to `NEW_ITEM_SOURCING`.
- No supplier is automatically assigned.
- Estimated unit price is used to calculate the initial requirement value.

This avoids treating an unknown item as an existing catalogue item without sufficient evidence.

## 5. Contract Selection and Consumption

Contracts are evaluated using the following conditions:

1. The contract must cover the resolved item.
2. The requirement date must fall within the contract validity period.
3. The contract supplier must be active.
4. The contract must have a corresponding item line.
5. The contract rate must be valid.
6. The remaining contract ceiling must cover the requirement value.

When multiple applicable contracts have sufficient capacity, the lowest-rate contract is selected. Contract ID is used as a tie-breaker.

### Cumulative Consumption

A shared consumption tracker is used throughout the assessment run.

Requirements are evaluated sequentially in chronological order. Once a contract PO is assigned, its requirement value is added to the contract's previous consumption.

This prevents later requirements from independently using the same remaining contract ceiling.

The implementation uses the contract's recorded consumed value as the initial tracker value.

### Valuation Assumption

The current valuation logic follows this priority:

1. Selected contract rate.
2. Lowest-rate applicable contract rate.
3. Latest eligible historical PO price within the configured valuation history window.
4. Item standard price.

If applicable contracts exist but none has sufficient remaining capacity, the lowest applicable contract rate is still used as the valuation reference. This is an implementation assumption that should be reviewed against procurement policy.

## 6. Purchase History

Purchase history is retrieved using the configured preferred supplier history period.

Historical records associated with inactive suppliers are excluded from supplier ranking and the relevant historical price selection.

For valuation, the latest eligible purchase history record within the configured valuation period is used when a contract rate is unavailable.

## 7. Preferred Supplier Ranking

The supplier ranking uses a weighted scoring approach.

The score considers:

- Purchase frequency.
- Recency of previous purchase orders.
- Historical contract association.
- On-time delivery percentage.
- Quality rating.

The general scoring formula is:

`Score = (PO Count × Frequency Weight) + (Recency Score × Recency Weight) + (Contract History × Contract Weight) + (On-Time Percentage × Delivery Weight) + (Quality Rating × Quality Weight)`

The weights and recency bands are stored in the policy configuration.

Suppliers are ranked in descending score order.

### Sourcing Fallback

When configured, the sourcing shortlist is supplemented with active suppliers whose categories match the requested item's category.

Fallback suppliers are ordered by:

1. On-time delivery percentage.
2. Quality rating.

These fallback suppliers receive a score of zero in the shortlist and are appended after the historically ranked suppliers.

Only the number of suppliers configured for the relevant sourcing route is included.

## 8. Procurement Decision Priority

The current decision engine applies the following order:

1. Validate plant.
2. Handle new-item sourcing.
3. Identify applicable item and suppliers.
4. Evaluate contracts and available ceilings.
5. Build supplier ranking and sourcing shortlist.
6. Apply CAPEX sourcing.
7. Apply contract PO.
8. Apply emergency PO conditions.
9. Apply spot PO conditions.
10. Apply RFQ threshold.
11. Apply RFP threshold.

### Emergency Purchase

An emergency PO requires:

- Emergency status on the requirement.
- Direct purchase value within the configured emergency limit.
- Eligible historical purchase activity.
- An available preferred supplier.

### Spot Purchase

A spot PO requires:

- Direct purchase value below the configured spot threshold.
- Eligible historical purchase activity.
- An available preferred supplier.

### RFQ and RFP

When direct purchasing conditions are not met, the requirement is evaluated against the configured RFQ and RFP value thresholds.

The configured supplier count controls the sourcing shortlist size.

The threshold comparison operators are implemented in the decision engine and should be checked against the exact policy wording at boundary values.

## 9. PO Consolidation

Only decisions with `decision = PO` are eligible for PO consolidation.

Requirements are grouped by:

- Supplier ID.
- Plant.
- Procurement route.
- Contract ID.

Requirements are consolidated within a 24-hour window measured from the first requirement in each bucket.

The window is anchored to the first requirement rather than extended by each subsequent requirement.

Each generated draft PO retains:

- Original PR references.
- Requirement IDs.
- Item details.
- Quantities.
- Unit prices.
- Line values.
- Supplier and contract details.

Generated PO numbers use the `DRAFT-PO-` prefix.

Requirements without a valid supplier or matching requirement record are skipped and recorded with a reason.

## 10. Error Handling

If an individual requirement fails during evaluation:

- The error is recorded against its requirement ID.
- The requirement receives a `MANUAL_REVIEW` decision.
- The route is marked `ENGINE_ERROR`.
- The error message is retained for investigation.

This allows the assessment to continue processing other requirements rather than stopping after one individual decision failure.

## 11. Policy Versioning

The policy model stores:

- Policy ID.
- Version.
- Effective date.
- Active status.
- Description.
- Flexible rule configuration.

The policy service selects an active policy whose effective date is on or before the assessment date.

It rejects missing policies, incomplete configurations and multiple eligible active policies.

The current implementation supports policy storage and effective-date-based retrieval. A complete user-facing amendment upload, preview, approval and activation workflow must be verified separately.

## 12. Known Limitations and Further Work

The following implementation gaps or assumptions require attention:

1. Clubbing windows are hardcoded in the clubbing service rather than dynamically read from the active policy.
2. Some decision logic depends on specific policy condition-string formats.
3. New-item policy clause `1.2` is hardcoded.
4. The current policy retrieval service does not itself implement amendment upload or approval.
5. The complete preferred supplier ranking export requires a dedicated CSV output.
6. Buyer approval, override comments and action audit history require separate verification.
7. Chat-based PR intake and PDF-only contract addition require separate verification.

These limitations are documented to make the implementation's current behaviour explicit and to guide further development.
