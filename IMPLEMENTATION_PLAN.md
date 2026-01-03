# DataNexum Graph Database Validation & Enhancement Plan

## Executive Summary

This document outlines a comprehensive plan to add validation features, parent-child relationship visualization, and documentation to ensure the graph database representation accurately reflects the source SQL data.

---

## Current State Analysis

### Graph Database Structure (from build_graph_db.py)

**Node Types:**
1. **Transaction** - Financial transactions (200 nodes)
2. **AFE** (Authorization for Expenditure) - Budget authorizations (30 nodes)
3. **Deck** - Cost centers/operational areas (20 nodes)
4. **BillingCategory** - Expense categories (25 nodes)
5. **Owner** - Title owners/stakeholders (15 nodes)
6. **Invoice** - Vendor invoices (50 nodes)
7. **Payment** - Payment records (40 nodes)

**Relationship Types:**
1. `CHARGED_TO`: Transaction → Deck, Invoice → Deck
2. **FUNDED_BY**: Transaction → AFE, Invoice → AFE
3. `CATEGORIZED_AS`: Transaction → BillingCategory
4. `ALLOCATED_TO`: Transaction → Owner (with allocation_percentage, allocated_amount)
5. `PAYS`: Payment → Invoice

### Current Gaps

1. **No Level 0 Overview**: Users can't see high-level table relationships
2. **No Validation Mechanism**: Can't compare graph data vs SQL source data
3. **Limited Parent-Child Visualization**: Relationships exist but not clearly visualized
4. **No Implementation Documentation**: Users don't know how the system was built
5. **No Testing Features**: Can't verify data integrity easily

---

## Phase 1: Level 0 Graph Overview

### Objective
Create a high-level schema visualization showing how tables/nodes are connected.

### Implementation Steps

#### 1.1 Create Schema Metadata Endpoint
- **File**: `app/api/graph/schema/route.ts`
- **Purpose**: Return graph schema metadata
- **Data Structure**:
```json
{
  "nodeTypes": [
    {
      "label": "Transaction",
      "count": 200,
      "properties": ["txn_id", "amount", "txn_date", "status"],
      "color": "#667eea"
    },
    // ... other node types
  ],
  "relationshipTypes": [
    {
      "type": "CHARGED_TO",
      "from": "Transaction",
      "to": "Deck",
      "count": 200,
      "description": "Transactions are charged to cost centers"
    },
    // ... other relationships
  ]
}
```

#### 1.2 Create Level 0 Schema Visualization Page
- **File**: `app/schema/page.tsx`
- **Features**:
  - Interactive diagram showing node types as boxes
  - Relationship arrows between node types
  - Click node to see sample data
  - Show cardinality (1:1, 1:N, N:M)
  - Export as image/PDF

#### 1.3 Add Schema Level to Graph Page
- Modify graph page to support "Level 0" (schema only)
- Levels: 0 (Schema), 1 (High-level), 2 (Medium), 3 (Detailed)

**Timeline**: 2-3 days

---

## Phase 2: Data Validation & Comparison System

### Objective
Allow users to verify that graph data matches the original SQL data source.

### Implementation Steps

#### 2.1 Create SQL Data Parser
- **File**: `lib/sql-parser.ts`
- **Purpose**: Parse enertia.sql file to extract expected data structure
- **Features**:
  - Extract table definitions (columns, types, constraints)
  - Parse sample INSERT statements
  - Build expected row counts per table

#### 2.2 Create Validation API Endpoint
- **File**: `app/api/validation/compare/route.ts`
- **Purpose**: Compare SQL source vs Neo4j graph data
- **Validation Checks**:
  1. **Node Count Validation**: SQL table row count == Neo4j node count
  2. **Relationship Integrity**: Foreign keys == Graph relationships
  3. **Data Type Validation**: SQL data types match graph property types
  4. **Value Comparison**: Sample random records and compare values
  5. **Completeness Check**: All SQL fields mapped to graph properties

#### 2.3 Create Validation Dashboard Page
- **File**: `app/validation/page.tsx`
- **Features**:
  - Upload/select SQL source file
  - Run validation tests
  - Display validation results with pass/fail indicators
  - Show discrepancies in detail
  - Export validation report (JSON/PDF)

**Example Validation Report**:
```
✓ Transaction count matches (200 SQL rows == 200 graph nodes)
✓ AFE count matches (30 SQL rows == 30 graph nodes)
✗ Owner allocations: 3 transactions missing allocation data
✓ All CHARGED_TO relationships valid (200/200)
⚠ Warning: 15 transactions with no AFE relationship
```

#### 2.4 Add Data Lineage Tracking
- **File**: `app/api/lineage/route.ts`
- **Purpose**: Show data flow from SQL → Graph → Dashboard
- **Features**:
  - Timestamp of data ingestion
  - Source SQL file hash/version
  - Transformation logs
  - Data freshness indicator

**Timeline**: 3-4 days

---

## Phase 3: Parent-Child Relationship Visualization

### Objective
Make hierarchical relationships clear and navigable.

### Implementation Steps

#### 3.1 Identify Parent-Child Patterns
Current hierarchies:
1. **AFE → Transactions** (1 parent → many children)
2. **Deck → Transactions** (1 parent → many children)
3. **Owner → Transaction Allocations** (many → many with allocation %)
4. **Invoice → Payments** (1 parent → many children)
5. **AFE → Invoices** (1 parent → many children)

#### 3.2 Create Hierarchy Visualization Component
- **File**: `components/graph/hierarchy-view.tsx`
- **Features**:
  - Tree layout (collapsible/expandable)
  - Show parent at top, children below
  - Display aggregated metrics (total spend, count)
  - Click to drill down
  - Breadcrumb navigation

#### 3.3 Add Hierarchy Mode to Graph Page
- Toggle between "Network View" and "Hierarchy View"
- Select root node type (AFE, Deck, Owner)
- Show depth levels (1-3)

#### 3.4 Create Relationship Explorer
- **File**: `app/relationships/page.tsx`
- **Features**:
  - List all relationship types
  - Show cardinality stats
  - View sample paths
  - Search for specific relationships

**Example Hierarchy View**:
```
AFE-2025-0001 ($2,500,000 budget)
├─ Transaction #10 ($114,601)
│  ├─ Owner: Coleman, Jordan and Carney (46%)
│  ├─ Owner: Palmer-Brady (24%)
│  └─ Owner: Taylor, Clark and Nguyen (30%)
├─ Transaction #25 ($75,000)
└─ Invoice INV-2025-00003 ($150,000)
   └─ Payment PMT-2025-00002 ($150,000)
```

**Timeline**: 2-3 days

---

## Phase 4: Testing & Validation Features

### Objective
Provide automated testing tools to ensure data integrity.

### Implementation Steps

#### 4.1 Create Test Suite
- **File**: `lib/validation-tests.ts`
- **Test Categories**:
  1. **Schema Tests**: Verify all node types exist
  2. **Constraint Tests**: Check uniqueness constraints
  3. **Relationship Tests**: Validate foreign key integrity
  4. **Financial Tests**: Budget vs actual, allocation sums to 100%
  5. **Orphan Detection**: Find nodes with no relationships
  6. **Data Quality Tests**: Null checks, range validation

#### 4.2 Create Testing Dashboard
- **File**: `app/testing/page.tsx`
- **Features**:
  - Run all tests or select specific test suites
  - Real-time test execution progress
  - Pass/fail results with details
  - Historical test runs
  - Schedule automated tests

#### 4.3 Add Data Quality Metrics
- **File**: `app/api/quality/metrics/route.ts`
- **Metrics**:
  - Completeness score (% of non-null required fields)
  - Consistency score (referential integrity)
  - Accuracy score (data type validation)
  - Timeliness score (data freshness)

#### 4.4 Create Sample Data Comparison Tool
- **File**: `app/testing/compare-records/page.tsx`
- **Features**:
  - Select a random transaction
  - Show SQL source data (if available)
  - Show graph representation
  - Highlight differences
  - Validate transformations

**Example Test Output**:
```
Test Suite: Financial Integrity
✓ All AFE budgets are positive numbers (30/30)
✓ All transaction amounts are within valid range (200/200)
✗ Failed: 3 transactions have allocation percentages that don't sum to 100%
  - Transaction #10: Total allocation = 100.07%
  - Transaction #42: Total allocation = 99.89%
  - Transaction #78: Total allocation = 100.15%
✓ All ALLOCATED_TO relationships have valid percentages (150/150)
```

**Timeline**: 3 days

---

## Phase 5: Implementation Documentation

### Objective
Create comprehensive README explaining how the system was built.

### Implementation Steps

#### 5.1 Create Main Implementation README
- **File**: `IMPLEMENTATION.md`
- **Sections**:
  1. Architecture Overview
  2. Data Flow Diagram
  3. Technology Stack
  4. Graph Schema Design Decisions
  5. Transformation Logic (SQL → Graph)
  6. API Documentation
  7. Deployment Guide
  8. Troubleshooting

#### 5.2 Create Developer Guide
- **File**: `DEVELOPER_GUIDE.md`
- **Sections**:
  1. Local development setup
  2. Running the build_graph_db.py script
  3. Fetching data with fetch-data.js
  4. Adding new node types
  5. Adding new relationships
  6. Modifying the dashboard
  7. Testing changes

#### 5.3 Create User Guide
- **File**: `USER_GUIDE.md`
- **Sections**:
  1. Dashboard overview
  2. Navigating the graph
  3. Understanding relationships
  4. Running validations
  5. Exporting data
  6. FAQ

#### 5.4 Add Inline Documentation
- JSDoc comments for all functions
- Component documentation
- API endpoint documentation
- Cypher query explanations

#### 5.5 Create Architecture Diagrams
- **System architecture** (Neo4j → API → Next.js → UI)
- **Data flow** (SQL → Python → Neo4j → Static JSON → Dashboard)
- **Component hierarchy**
- **Graph schema** (node types and relationships)

**Timeline**: 2 days

---

## Phase 6: Enhanced Graph Features

### Additional Features to Consider

#### 6.1 Query Builder
- Visual query builder for non-technical users
- Select node type → Add filters → Choose relationships
- Generate and execute Cypher queries
- Export results as CSV/JSON

#### 6.2 Anomaly Detection
- Flag unusual patterns:
  - Transactions without AFE
  - Over-budget AFEs
  - Orphaned nodes
  - Allocation percentage errors
- Alert dashboard

#### 6.3 Time-based Analysis
- Timeline view of transactions
- Budget burn rate over time
- Owner allocation changes
- AFE lifecycle visualization

#### 6.4 Comparison Tools
- Compare two AFEs side-by-side
- Compare owner allocations
- Period-over-period analysis

**Timeline**: 4-5 days (optional enhancements)

---

## Implementation Priority & Timeline

### High Priority (Must Have)
1. **Phase 1**: Level 0 Schema Overview (2-3 days)
2. **Phase 2**: Data Validation System (3-4 days)
3. **Phase 5**: Implementation Documentation (2 days)

**Total**: 7-9 days

### Medium Priority (Should Have)
4. **Phase 3**: Parent-Child Visualization (2-3 days)
5. **Phase 4**: Testing Features (3 days)

**Total**: 5-6 days

### Low Priority (Nice to Have)
6. **Phase 6**: Enhanced Features (4-5 days)

---

## Technical Architecture

### Data Flow
```
SQL Source (enertia.sql)
  ↓
Python Script (build_graph_db.py)
  ↓
Neo4j Database
  ↓
Next.js API (fetch-data.js)
  ↓
Static JSON Files (data/*.json)
  ↓
Dashboard UI (React Components)
```

### Validation Flow
```
SQL Source → Parser → Expected Schema
Neo4j DB → API → Actual Schema
  ↓
Comparison Engine
  ↓
Validation Report
```

---

## Success Metrics

1. **Validation Accuracy**: 100% of SQL data correctly mapped to graph
2. **Test Coverage**: All critical paths tested
3. **Documentation Completeness**: All features documented
4. **User Confidence**: Users can independently verify data correctness
5. **Performance**: Validation runs in < 10 seconds

---

## Risk Mitigation

### Risk 1: SQL Parser Complexity
- **Mitigation**: Start with simple table/column parsing, add complexity incrementally
- **Fallback**: Manual schema definition file

### Risk 2: Data Discrepancies
- **Mitigation**: Build flexible comparison logic with tolerance levels
- **Fallback**: Flag for manual review rather than failing

### Risk 3: Performance with Large Datasets
- **Mitigation**: Implement pagination, caching, and progressive loading
- **Fallback**: Sample-based validation for large datasets

---

## Next Steps

1. **Review and approve this plan**
2. **Prioritize phases based on urgency**
3. **Begin Phase 1: Level 0 Schema Overview**
4. **Set up validation test environment**
5. **Create documentation templates**

---

## Questions for Clarification

1. Do you have access to the original SQL data for comparison, or should we use the mock data generated by build_graph_db.py?
2. What level of discrepancy is acceptable (exact match vs. tolerance)?
3. Should validation be automated/scheduled or manual/on-demand?
4. Do you want to support uploading new SQL files for re-validation?
5. What's the priority: validation first or visualization first?

---

*Document Version: 1.0*
*Created: 2025-12-18*
*Status: Awaiting Approval*
