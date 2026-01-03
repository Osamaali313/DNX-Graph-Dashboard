import { executeReadQuery } from './neo4j';
import type {
  DashboardStats,
  Transaction,
  TransactionFilters,
  AFE,
  AFEBudgetStatus,
  DeckSpending,
  OwnerAllocation,
  SearchResult,
} from './types';

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const query = `
    MATCH (t:Transaction)
    OPTIONAL MATCH (a:AFE)
    OPTIONAL MATCH (d:Deck)
    OPTIONAL MATCH (o:Owner)
    OPTIONAL MATCH (i:Invoice)
    OPTIONAL MATCH (p:Payment)
    RETURN
      count(DISTINCT t) as transactionCount,
      sum(t.amount) as totalAmount,
      count(DISTINCT a) as afeCount,
      count(DISTINCT d) as deckCount,
      count(DISTINCT o) as ownerCount,
      count(DISTINCT i) as invoiceCount,
      count(DISTINCT p) as paymentCount
  `;

  const result = await executeReadQuery<DashboardStats>(query);
  return result[0] || {
    transactionCount: 0,
    totalAmount: 0,
    afeCount: 0,
    deckCount: 0,
    ownerCount: 0,
    invoiceCount: 0,
    paymentCount: 0,
  };
}

/**
 * Get transactions with optional filters
 */
export async function getTransactions(
  filters: TransactionFilters = {}
): Promise<Transaction[]> {
  const {
    limit = 50,
    offset = 0,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    status,
    category,
  } = filters;

  let whereClauses: string[] = [];
  const params: Record<string, any> = { limit, offset };

  if (dateFrom) {
    whereClauses.push('t.txn_date >= datetime($dateFrom)');
    params.dateFrom = dateFrom;
  }

  if (dateTo) {
    whereClauses.push('t.txn_date <= datetime($dateTo)');
    params.dateTo = dateTo;
  }

  if (minAmount !== undefined) {
    whereClauses.push('t.amount >= $minAmount');
    params.minAmount = minAmount;
  }

  if (maxAmount !== undefined) {
    whereClauses.push('t.amount <= $maxAmount');
    params.maxAmount = maxAmount;
  }

  if (status) {
    whereClauses.push('t.status = $status');
    params.status = status;
  }

  if (category) {
    whereClauses.push('t.bill_cat_code = $category');
    params.category = category;
  }

  const whereClause =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const query = `
    MATCH (t:Transaction)
    ${whereClause}
    RETURN t.txn_id as txn_id,
           t.txn_hdr_id as txn_hdr_id,
           toString(t.txn_date) as txn_date,
           t.amount as amount,
           t.description as description,
           t.status as status,
           t.quantity as quantity,
           t.uom_code as uom_code,
           t.deck_tid as deck_tid,
           t.bill_cat_code as bill_cat_code,
           t.afe_tid as afe_tid,
           toString(t.created_date) as created_date,
           toString(t.modified_date) as modified_date
    ORDER BY t.txn_date DESC
    SKIP $offset
    LIMIT $limit
  `;

  return executeReadQuery<Transaction>(query, params);
}

/**
 * Get single transaction by ID with relationships
 */
export async function getTransactionById(id: string): Promise<any> {
  const query = `
    MATCH (t:Transaction {txn_id: toInteger($id)})
    OPTIONAL MATCH (t)-[:CHARGED_TO]->(d:Deck)
    OPTIONAL MATCH (t)-[:CATEGORIZED_AS]->(b:BillingCategory)
    OPTIONAL MATCH (t)-[:FUNDED_BY]->(a:AFE)
    OPTIONAL MATCH (t)-[alloc:ALLOCATED_TO]->(o:Owner)
    RETURN t as transaction,
           d as deck,
           b as billing_category,
           a as afe,
           collect({owner: o, allocation: alloc}) as allocations
  `;

  const result = await executeReadQuery(query, { id });
  return result[0] || null;
}

/**
 * Get all AFEs with budget status
 */
export async function getAFEs(): Promise<AFEBudgetStatus[]> {
  const query = `
    MATCH (a:AFE)
    OPTIONAL MATCH (t:Transaction)-[:FUNDED_BY]->(a)
    RETURN a.afe_id as afe_id,
           a.afe_number as afe_number,
           a.description as description,
           a.status as status,
           a.total_budget as total_budget,
           toString(a.begin_date) as begin_date,
           toString(a.complete_date) as complete_date,
           a.objective_code as objective_code,
           a.project_code as project_code,
           toString(a.created_date) as created_date,
           coalesce(sum(t.amount), 0) as spent,
           a.total_budget - coalesce(sum(t.amount), 0) as remaining,
           CASE
             WHEN a.total_budget > 0
             THEN round((coalesce(sum(t.amount), 0) / a.total_budget) * 100, 2)
             ELSE 0
           END as percentUsed
    ORDER BY percentUsed DESC
  `;

  return executeReadQuery<AFEBudgetStatus>(query);
}

/**
 * Get single AFE by ID with all transactions
 */
export async function getAFEById(id: string): Promise<any> {
  const query = `
    MATCH (a:AFE {afe_id: toInteger($id)})
    OPTIONAL MATCH (t:Transaction)-[:FUNDED_BY]->(a)
    OPTIONAL MATCH (i:Invoice)-[:FUNDED_BY]->(a)
    RETURN a as afe,
           collect(DISTINCT t) as transactions,
           collect(DISTINCT i) as invoices,
           sum(t.amount) as total_spent,
           count(DISTINCT t) as transaction_count
  `;

  const result = await executeReadQuery(query, { id });
  return result[0] || null;
}

/**
 * Get spending by deck/cost center
 */
export async function getDeckSpending(): Promise<DeckSpending[]> {
  const query = `
    MATCH (t:Transaction)-[:CHARGED_TO]->(d:Deck)
    RETURN d.deck_code as deck_code,
           d.description as deck_description,
           d.deck_type as deck_type,
           count(t) as transaction_count,
           sum(t.amount) as total_cost,
           avg(t.amount) as avg_cost
    ORDER BY total_cost DESC
  `;

  return executeReadQuery<DeckSpending>(query);
}

/**
 * Get owner allocation summaries
 */
export async function getOwnerAllocations(): Promise<OwnerAllocation[]> {
  const query = `
    MATCH (o:Owner)<-[a:ALLOCATED_TO]-(t:Transaction)
    RETURN o.owner_name as owner_name,
           o.owner_status as owner_status,
           count(t) as transaction_count,
           sum(a.allocated_amount) as total_allocation,
           avg(a.allocation_percentage) as avg_percentage
    ORDER BY total_allocation DESC
  `;

  return executeReadQuery<OwnerAllocation>(query);
}

/**
 * Search across all entity types
 */
export async function searchEntities(
  searchQuery: string,
  entityType?: string
): Promise<SearchResult[]> {
  const searchLower = searchQuery.toLowerCase();

  const query = `
    CALL {
      MATCH (t:Transaction)
      WHERE toLower(toString(t.txn_id)) CONTAINS $searchQuery
         OR toLower(t.description) CONTAINS $searchQuery
      RETURN
        toString(t.txn_id) as id,
        'Transaction' as type,
        'Transaction #' + toString(t.txn_id) as label,
        t.description as description,
        t as properties
      LIMIT 5

      UNION

      MATCH (a:AFE)
      WHERE toLower(a.afe_number) CONTAINS $searchQuery
         OR toLower(a.description) CONTAINS $searchQuery
      RETURN
        toString(a.afe_id) as id,
        'AFE' as type,
        a.afe_number as label,
        a.description as description,
        a as properties
      LIMIT 5

      UNION

      MATCH (d:Deck)
      WHERE toLower(d.deck_code) CONTAINS $searchQuery
         OR toLower(d.description) CONTAINS $searchQuery
      RETURN
        toString(d.deck_id) as id,
        'Deck' as type,
        d.deck_code as label,
        d.description as description,
        d as properties
      LIMIT 5

      UNION

      MATCH (o:Owner)
      WHERE toLower(o.owner_name) CONTAINS $searchQuery
      RETURN
        toString(o.owner_id) as id,
        'Owner' as type,
        o.owner_name as label,
        o.owner_status as description,
        o as properties
      LIMIT 5
    }
    RETURN id, type, label, description, properties
    LIMIT 20
  `;

  return executeReadQuery<SearchResult>(query, { searchQuery: searchLower });
}

/**
 * Get financial flow data for Sankey diagram
 */
export async function getFinancialFlow(dateFrom?: string, dateTo?: string) {
  let whereClauses: string[] = [];
  const params: Record<string, any> = {};

  if (dateFrom) {
    whereClauses.push('t.txn_date >= datetime($dateFrom)');
    params.dateFrom = dateFrom;
  }

  if (dateTo) {
    whereClauses.push('t.txn_date <= datetime($dateTo)');
    params.dateTo = dateTo;
  }

  const whereClause =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const query = `
    MATCH (a:AFE)<-[:FUNDED_BY]-(t:Transaction)-[:CHARGED_TO]->(d:Deck)
    ${whereClause}
    RETURN a.afe_number as source,
           d.deck_code as target,
           sum(t.amount) as value
    ORDER BY value DESC
    LIMIT 50
  `;

  return executeReadQuery(query, params);
}

/**
 * Get network graph data
 */
export async function getNetworkData(centerNode?: string, depth: number = 2) {
  const query = centerNode
    ? `
    MATCH (center {txn_id: toInteger($centerNode)})
    CALL apoc.path.subgraphNodes(center, {maxLevel: $depth}) YIELD node
    WITH collect(node) as nodes
    UNWIND nodes as n
    MATCH (n)-[r]-(m)
    WHERE m IN nodes
    RETURN collect(DISTINCT n) as nodes, collect(DISTINCT r) as relationships
  `
    : `
    MATCH (n)
    WITH n LIMIT 100
    MATCH (n)-[r]-(m)
    RETURN collect(DISTINCT n) as nodes, collect(DISTINCT r) as relationships
  `;

  const params = centerNode ? { centerNode, depth } : {};
  return executeReadQuery(query, params);
}
