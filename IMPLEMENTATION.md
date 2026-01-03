# DataNexum Financial Dashboard - Implementation Guide

**Version:** 1.0
**Last Updated:** December 18, 2025
**Status:** Production Ready

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Data Flow](#data-flow)
4. [Graph Schema Design](#graph-schema-design)
5. [Implementation Steps](#implementation-steps)
6. [API Documentation](#api-documentation)
7. [Component Structure](#component-structure)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

DataNexum is a modern web application that visualizes financial data from a Neo4j graph database through an interactive Next.js dashboard.

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SQL Source Data                          │
│                    (enertia.sql)                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Python Ingestion Script                         │
│              (build_graph_db.py)                             │
│  - Generates mock data                                       │
│  - Creates node constraints                                  │
│  - Builds relationships                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Neo4j Graph Database                        │
│                  (localhost:7687)                            │
│  Node Types: Transaction, AFE, Deck, Owner,                  │
│              BillingCategory, Invoice, Payment               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js Data Fetcher                            │
│              (scripts/fetch-data.js)                         │
│  - Queries Neo4j for all data                                │
│  - Generates static JSON files                               │
│  - Creates multi-level graph data                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Static JSON Files                               │
│              (data/*.json)                                   │
│  - transactions.json (200 records)                           │
│  - afes.json (30 records)                                    │
│  - decks.json (20 records)                                   │
│  - owners.json (15 records)                                  │
│  - network-data.json (multi-level)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js API Routes                              │
│              (app/api/*)                                     │
│  - Reads static JSON files                                   │
│  - Performs filtering/sorting                                │
│  - Returns JSON responses                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              React Dashboard UI                              │
│              (app/*/page.tsx)                                │
│  13 Pages: Dashboard, Schema, Graph, Validation,             │
│           Relationships, Transactions, AFEs, Decks,          │
│           Owners, Flow, Query, Reports                       │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Static Data Approach**: Pre-fetched JSON files for 50-100x faster loading vs live Neo4j queries
2. **Multi-Level Graph Data**: Level 0 (schema), Level 1 (33 nodes), Level 2 (66 nodes), Level 3 (111 nodes)
3. **Server-Side Rendering**: Next.js App Router with client/server components
4. **Type Safety**: Full TypeScript coverage for data structures
5. **Modern UI**: shadcn/ui components with Tailwind CSS

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16 with Turbopack
- **Language**: TypeScript 5+
- **UI Library**: React 18
- **Component Library**: shadcn/ui (Radix UI + Tailwind)
- **Styling**: Tailwind CSS with OKLCH color space
- **Graph Visualization**: ReactFlow
- **Theme**: next-themes (dark/light mode)
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js 22+
- **Database**: Neo4j 5.x
- **ORM/Driver**: Neo4j JavaScript Driver
- **Data Processing**: Python 3.10+ (data ingestion)

### Development Tools
- **Package Manager**: npm
- **Linter**: ESLint
- **Formatter**: Prettier (implicit)
- **Version Control**: Git

---

## Data Flow

### 1. Initial Data Ingestion

```bash
# Navigate to graph DB directory
cd "C:\Users\PMLS\Downloads\Enertia Graph DB Representation"

# Run Python ingestion script
python build_graph_db.py --clear-db

# Output:
# - Creates 7 node types in Neo4j
# - Creates 7 relationship types
# - Generates validation report (ingestion_report.md)
```

**Node Creation:**
- Transaction: 200 nodes
- AFE: 30 nodes
- Deck: 20 nodes
- BillingCategory: 25 nodes
- Owner: 15 nodes
- Invoice: 50 nodes
- Payment: 40 nodes

**Relationship Creation:**
- CHARGED_TO: Transaction → Deck (200)
- FUNDED_BY: Transaction → AFE (200)
- CATEGORIZED_AS: Transaction → BillingCategory (200)
- ALLOCATED_TO: Transaction → Owner (150, N:M)
- PAYS: Payment → Invoice (40)
- Invoice CHARGED_TO Deck (50)
- Invoice FUNDED_BY AFE (50)

### 2. Static Data Generation

```bash
# Navigate to dashboard directory
cd "C:\Users\PMLS\Downloads\enertia-financial-dashboard"

# Fetch data from Neo4j
npm run fetch-data  # Runs scripts/fetch-data.js

# Output files in data/ directory:
# - transactions.json
# - afes.json
# - decks.json
# - owners.json
# - flow-data.json
# - network-data.json (with level1, level2, level3)
# - metadata.json
```

**Data Transformations:**
- Neo4j DateTime → ISO 8601 strings
- Neo4j Integer → JavaScript numbers
- Relationships → Embedded objects (e.g., transaction.owners[])

### 3. API Request Flow

```
User Browser Request
    ↓
Next.js API Route (e.g., /api/transactions)
    ↓
Static Data Library (lib/static-data.ts)
    ↓
Read JSON File (data/transactions.json)
    ↓
Filter/Sort/Paginate
    ↓
Return JSON Response
    ↓
React Component State Update
    ↓
UI Re-render
```

---

## Graph Schema Design

### Node Types

#### 1. Transaction
```typescript
interface Transaction {
  txn_id: number;              // Primary key
  txn_date: DateTime;          // Transaction date
  amount: number;              // Dollar amount
  description: string;         // Description
  status: string;              // APPROVED | PENDING | POSTED | REJECTED
  quantity: number;            // Quantity
  uom_code: string;            // Unit of measure
  deck_tid: number;            // Foreign key → Deck
  bill_cat_code: string;       // Foreign key → BillingCategory
  afe_tid: number;             // Foreign key → AFE
  owners: Owner[];             // Allocated owners (embedded)
}
```

#### 2. AFE (Authorization for Expenditure)
```typescript
interface AFE {
  afe_id: number;              // Primary key
  afe_number: string;          // AFE number (e.g., "AFE-2025-0001")
  description: string;         // Project description
  status: string;              // ACTIVE | CLOSED | PENDING | APPROVED
  total_budget: number;        // Budget amount
  begin_date: DateTime;        // Start date
  complete_date: DateTime;     // End date
  objective_code: string;      // DRILL | COMPLETE | WORKOVER | FACILITY
  project_code: string;        // Project code
}
```

#### 3. Deck (Cost Center)
```typescript
interface Deck {
  deck_id: number;             // Primary key
  deck_code: string;           // Deck code (e.g., "DECK-001")
  description: string;         // Description
  deck_type: string;           // OPERATING | CAPITAL | OVERHEAD | REVENUE
  inactive: boolean;           // Active status
  xref: string;                // Cross-reference
}
```

#### 4. Owner (Title Owner)
```typescript
interface Owner {
  owner_id: number;            // Primary key
  owner_name: string;          // Owner name
  owner_status: string;        // ACTIVE | INACTIVE | SUSPENDED
  address: string;             // Street address
  city: string;                // City
  state_code: string;          // State
  zip_code: string;            // ZIP code
  email: string;               // Email
  tax_id: string;              // Tax ID
  interest_type_code: string;  // WI | RI | NRI | ORRI
  surface_acres: number;       // Surface acres
}
```

### Relationship Types

#### 1. CHARGED_TO (Transaction → Deck)
```cypher
(t:Transaction)-[r:CHARGED_TO {
  amount: t.amount,
  created_date: t.created_date
}]->(d:Deck)
```
**Cardinality**: N:1 (Many transactions to one deck)

#### 2. FUNDED_BY (Transaction → AFE)
```cypher
(t:Transaction)-[r:FUNDED_BY {
  amount: t.amount,
  approved_date: t.created_date
}]->(a:AFE)
```
**Cardinality**: N:1 (Many transactions to one AFE)

#### 3. ALLOCATED_TO (Transaction → Owner)
```cypher
(t:Transaction)-[r:ALLOCATED_TO {
  allocation_percentage: 25.5,
  allocated_amount: 10588.24
}]->(o:Owner)
```
**Cardinality**: N:M (Many transactions to many owners)

### Schema Evolution

**Version 1.0 (Current)**:
- 7 node types, 7 relationship types
- Owner allocations embedded in transactions for performance

**Future Considerations**:
- Add Well nodes
- Add Entity (Corporation) nodes
- Add temporal versioning for historical tracking
- Add audit trail nodes

---

## Implementation Steps

### Step 1: Neo4j Database Setup

1. **Install Neo4j Desktop**:
   ```
   Download from: https://neo4j.com/download/
   ```

2. **Create Database**:
   - Name: "Enertia Financial"
   - Password: Set in `.env` file
   - Port: 7687 (bolt), 7474 (browser)

3. **Configure Connection**:
   ```bash
   # In Enertia Graph DB Representation directory
   cp .env.example .env
   # Edit .env:
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_password
   ```

### Step 2: Data Ingestion

1. **Install Python Dependencies**:
   ```bash
   cd "Enertia Graph DB Representation"
   pip install neo4j python-dotenv faker tqdm
   ```

2. **Run Ingestion Script**:
   ```bash
   python build_graph_db.py --clear-db
   ```

3. **Verify in Neo4j Browser**:
   ```cypher
   // Check node counts
   MATCH (n) RETURN labels(n)[0] as NodeType, count(n) as Count

   // Check relationships
   MATCH ()-[r]->() RETURN type(r) as RelType, count(r) as Count
   ```

### Step 3: Next.js Dashboard Setup

1. **Install Dependencies**:
   ```bash
   cd enertia-financial-dashboard
   npm install
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local:
   NEXT_PUBLIC_APP_NAME=DataNexum Financial Dashboard
   ```

3. **Fetch Static Data**:
   ```bash
   npm run fetch-data
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Access Dashboard**:
   ```
   http://localhost:3000
   ```

### Step 4: Production Build

1. **Build Application**:
   ```bash
   npm run build
   ```

2. **Start Production Server**:
   ```bash
   npm start
   ```

---

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### GET /api/graph/stats
Returns dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTransactions": 200,
    "totalAmount": 15000000.50,
    "activeAFEs": 25,
    "totalOwners": 15,
    "totalDecks": 20,
    "totalRelationships": 690,
    "pendingTransactions": 45,
    "afeBudgetSummary": {
      "totalBudget": 50000000,
      "totalSpent": 15000000,
      "remaining": 35000000
    }
  }
}
```

#### GET /api/transactions
Returns paginated list of transactions.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50, max: 100)
- `status` (filter by status)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "txnId": 200,
      "txnDate": "2025-12-06",
      "amount": 415208.79,
      "description": "Transaction description",
      "status": "POSTED",
      "deckId": 6,
      "deckCode": "DECK-006",
      "afeId": 5,
      "afeNumber": "AFE-2025-0005",
      "billingCategory": "CAT-125",
      "owners": [
        {
          "ownerId": 3,
          "ownerName": "Coleman, Jordan and Carney",
          "allocationPercentage": 46.07,
          "allocatedAmount": 52802.42
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 200
  }
}
```

#### GET /api/graph/network
Returns graph network data for visualization.

**Query Parameters:**
- `depth` (0-3): Level of detail
  - 0: Schema only (node types)
  - 1: High-level (33 nodes)
  - 2: Medium (66 nodes)
  - 3: Detailed (111 nodes)
- `centerNode` (optional): Focus on specific node

**Response:**
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "txn-200",
        "type": "Transaction",
        "label": "Transaction #200"
      }
    ],
    "edges": [
      {
        "source": "txn-200",
        "target": "deck-6",
        "type": "CHARGED_TO"
      }
    ]
  }
}
```

#### GET /api/graph/schema
Returns graph schema metadata.

**Response:**
```json
{
  "success": true,
  "data": {
    "nodeTypes": [...],
    "relationshipTypes": [...],
    "hierarchy": {...},
    "metadata": {...}
  }
}
```

#### GET /api/validation/run
Runs full validation suite and returns report.

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-12-18T...",
    "summary": {
      "total": 19,
      "passed": 16,
      "failed": 0,
      "warnings": 3,
      "successRate": 84.2
    },
    "suites": [...],
    "nodeComparisons": [...],
    "relationshipComparisons": [...],
    "integrityIssues": [...],
    "recommendations": [...]
  }
}
```

---

## Component Structure

### Pages (app/*/page.tsx)

1. **Dashboard** (`/`): Summary statistics and key metrics
2. **Schema** (`/schema`): Graph schema overview (Level 0)
3. **Graph** (`/graph`): Interactive network visualization
4. **Relationships** (`/relationships`): Hierarchy explorer
5. **Validation** (`/validation`): Data validation dashboard
6. **Transactions** (`/transactions`): Transaction list
7. **AFEs** (`/afes`): AFE tracker
8. **Decks** (`/decks`): Cost centers
9. **Owners** (`/owners`): Ownership tracking
10. **Flow** (`/flow`): Financial flow visualization
11. **Query** (`/query`): Query builder
12. **Reports** (`/reports`): Report generator

### Shared Components

#### Layout Components
- `Sidebar`: Navigation menu
- `Navbar`: Top navigation bar with theme toggle
- `ThemeProvider`: Dark/light mode context

#### Graph Components
- `HierarchyTree`: Collapsible tree visualization

#### UI Components (shadcn/ui)
- Card, Button, Badge, Input, Select
- All in `components/ui/`

---

## Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables
```env
NEXT_PUBLIC_APP_NAME=DataNexum Financial Dashboard
NEXT_PUBLIC_APP_DESCRIPTION=Interactive financial graph database visualization
```

---

## Troubleshooting

### Issue: Neo4j Connection Failed
**Solution**:
1. Verify Neo4j is running: Check Neo4j Desktop
2. Check credentials in `.env`
3. Test connection: `http://localhost:7474`

### Issue: Static Data Not Loading
**Solution**:
1. Run `npm run fetch-data`
2. Check `data/` directory exists
3. Verify JSON files are valid

### Issue: Graph Not Rendering
**Solution**:
1. Check browser console for errors
2. Verify ReactFlow is installed
3. Clear browser cache and reload

### Issue: Dark Mode Not Working
**Solution**:
1. Check `ThemeProvider` is wrapping app
2. Verify `next-themes` is installed
3. Clear local storage and refresh

---

## Additional Resources

- **Neo4j Documentation**: https://neo4j.com/docs/
- **Next.js Documentation**: https://nextjs.org/docs
- **ReactFlow Documentation**: https://reactflow.dev/
- **shadcn/ui Documentation**: https://ui.shadcn.com/

---

**Document Version**: 1.0
**Last Updated**: December 18, 2025
**Maintained By**: Development Team
