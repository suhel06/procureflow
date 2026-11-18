# APPROACH.md

## Development Approach

ProcureFlow was developed as an individual full-stack project for the Cantill.ai Full-stack Intern Task.

The implementation was divided into the following areas:

1. Data modelling and MongoDB integration.
2. Item matching and purchase request processing.
3. Purchase requisition clubbing.
4. Policy-driven procurement decision evaluation.
5. Contract validity and consumption tracking.
6. Preferred supplier ranking.
7. Purchase order consolidation.
8. Backend APIs and frontend dashboard.
9. Assessment reporting and CSV exports.

## Technology Choices

- React and Vite were used for the frontend.
- Node.js and Express were used to build the backend API.
- MongoDB and Mongoose were used for persistence and data modelling.
- JavaScript was used for the procurement processing logic.

## Procurement Processing Approach

The assessment engine follows a sequential processing workflow:

1. Load the active procurement policy.
2. Retrieve PR lines in chronological order.
3. Match requested items against the item catalogue.
4. Group eligible PR lines into requirements.
5. Evaluate each requirement against the active policy.
6. Track cumulative contract consumption.
7. Consolidate eligible purchase orders.
8. Export assessment results.

Sequential evaluation was chosen because contract consumption is cumulative and the result of an earlier requirement can affect the available contract ceiling for a later requirement.

## Supplier Ranking Approach

The supplier ranking logic combines several factors:

- Historical purchase frequency.
- Recency of previous purchases.
- Historical contract association.
- On-time delivery performance.
- Quality rating.

The weighted scoring approach is configurable through the supplier ranking section of the procurement policy.

## Error Handling

The assessment process records individual requirement evaluation errors instead of silently ignoring them. A failed requirement is represented as a manual-review decision with an associated error reason.

Requests that cannot be matched are recorded separately for review.

## Use of AI Tools

AI tools, including ChatGPT, were used as development assistance during this project.

Their use included:

- Understanding procurement requirements and breaking them into implementation tasks.
- Discussing application architecture and data flow.
- Debugging JavaScript and Node.js implementation issues.
- Reviewing procurement decision logic.
- Improving frontend components and user interactions.
- Reviewing documentation and identifying gaps against the task brief.

AI-generated suggestions were reviewed and adapted during implementation. The application code was tested locally, and the developer remains responsible for understanding and explaining the implementation.

## Testing Approach

Functional testing was performed on the main application modules:

- Overview dashboard.
- Purchase Requests.
- AI Decisions.
- Purchase Orders.
- Contracts.
- Suppliers.
- Settings.
- Assessment execution.
- Report export.

The procurement assessment script and validation checks were also used during development.

## Limitations and Future Improvements

The following areas require further verification or implementation against the complete assessment requirements:

- User-facing policy amendment upload, preview and approval workflow.
- Fully configurable policy-driven rule execution.
- Chat-based purchase request intake.
- Preferred supplier ranking CSV export.
- Buyer approval, override comments and audit history.
- PDF-only contract addition.
- Hosted deployment and blind-test validation.

These items should not be considered complete until verified in the running application.
