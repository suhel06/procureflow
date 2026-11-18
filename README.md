# ProcureFlow

A policy-driven procurement assessment application for Corvo Engineering, built as part of the Cantill.ai Full-stack Intern Task.

## Overview

ProcureFlow processes purchase requisitions (PRs), matches requested items against an item catalogue, groups eligible PR lines into requirements, evaluates procurement routes using an active procurement policy, and consolidates eligible purchase orders.

The application uses a React frontend, Node.js/Express backend and MongoDB database.

## Technology Stack

- **Frontend:** React, Vite, JavaScript, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Other tools:** Git, npm

## Main Features

- Procurement assessment dashboard and summary metrics.
- Purchase request listing and search.
- Item matching against the item catalogue.
- PR clubbing by item, plant, creation date and need-by date.
- Procurement decision evaluation.
- Contract validity and cumulative ceiling checks.
- Preferred supplier scoring using purchase history, recency, contract history, delivery performance and quality.
- Purchase order consolidation.
- Purchase order, contract and supplier views.
- Assessment report and CSV exports.

## Application Architecture

```text
React Frontend
      |
      v
Express Backend API
      |
      v
MongoDB Database
      |
      v
Procurement Services
  |       |        |
  v       v        v
Matching Clubbing Decision Engine
                    |
                    v
              PO Consolidation
                    |
                    v
                Exporter
```

## Project Structure

```text
procureflow/
├── api/
├── client/
│   └── src/
│       ├── components/
│       └── App.jsx
├── data/
├── output/
├── public/
├── src/
│   ├── config/
│   ├── models/
│   ├── scripts/
│   └── services/
├── submission/
├── .gitignore
├── DECISIONS.md
├── APPROACH.md
├── package.json
└── server.js
```

## Local Setup

### Prerequisites

- Node.js and npm
- MongoDB database
- Git

### 1. Clone the repository

```bash
git clone YOUR_PUBLIC_GITHUB_REPOSITORY_URL
cd procureflow
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root and configure the MongoDB connection variable expected by `src/config/db.js`.

Do not commit `.env` or database credentials.

### 4. Import the procurement policy

```bash
node src/scripts/importPolicy.js
```

### 5. Start the backend

```bash
npm run dev
```

The backend currently runs at:

```text
http://localhost:3000
```

### 6. Start the frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Vite normally serves the frontend at:

```text
http://localhost:5173
```

## Running the Procurement Assessment

Run the assessment script from the project root:

```bash
node src/scripts/testAllClubbing.js
```

The script:

1. Connects to MongoDB.
2. Loads the active procurement policy.
3. Retrieves purchase requests chronologically.
4. Matches PR items against the item catalogue.
5. Clubs eligible PR lines into requirements.
6. Evaluates requirements sequentially while tracking contract consumption.
7. Consolidates eligible purchase orders.
8. Exports assessment results.

## API Endpoints

The application includes the following endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/assessment/summary` | Assessment summary |
| GET | `/api/assessment/decisions` | Procurement decisions |
| GET | `/api/assessment/purchase-orders` | Purchase orders |
| POST | `/api/assessment/run` | Run a new assessment |
| GET | `/api/purchase-requests` | Purchase requests |
| GET | `/api/contracts` | Contracts |
| GET | `/api/suppliers` | Suppliers |
| GET | `/api/health` | Backend health check |

## Generated Outputs

The assessment exporter generates files in `output/`:

- `assessment_decisions.csv`
- `purchase_orders.csv`
- `assessment_report.json`

The `submission/` directory is reserved for the final blind-test CSV exports.

## Documentation

- `DECISIONS.md` — business assumptions and implementation decisions.
- `APPROACH.md` — development approach and AI tool usage.

## Important Notes

This project was developed for the Cantill.ai procurement assessment. The README describes the implemented application and local development workflow. Verify the live deployment, policy amendment workflow and required blind-test exports before treating the application as fully submission-ready.

## Author

Developed as an individual full-stack engineering assessment project.
