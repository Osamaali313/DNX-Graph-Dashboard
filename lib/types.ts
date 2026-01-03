// Node Types

export interface Transaction {
  txn_id: number;
  txn_hdr_id: number;
  txn_date: string;
  amount: number;
  description: string;
  status: string;
  quantity?: number;
  uom_code?: string;
  deck_tid?: number;
  bill_cat_code?: string;
  afe_tid?: number;
  created_date: string;
  modified_date?: string;
}

export interface AFE {
  afe_id: number;
  afe_number: string;
  description: string;
  status: string;
  total_budget: number;
  begin_date: string;
  complete_date?: string;
  objective_code?: string;
  project_code?: string;
  created_date: string;
}

export interface BillingCategory {
  bill_cat_code: string;
  description: string;
  type: string;
  taxable: boolean;
  jib: boolean;
  created_date: string;
}

export interface Deck {
  deck_id: number;
  deck_code: string;
  description: string;
  deck_type: string;
  inactive: boolean;
  xref?: string;
  created_date: string;
}

export interface Owner {
  owner_id: number;
  owner_name: string;
  owner_status: string;
  address?: string;
  city?: string;
  state_code?: string;
  zip_code?: string;
  email?: string;
  tax_id?: string;
  interest_type_code?: string;
  surface_acres?: number;
  created_date: string;
}

export interface Invoice {
  invoice_id: number;
  invoice_number: string;
  invoice_date: string;
  amount: number;
  status: string;
  vendor_name: string;
  deck_tid?: number;
  afe_tid?: number;
  created_date: string;
}

export interface Payment {
  payment_id: number;
  payment_number: string;
  payment_date: string;
  amount: number;
  status: string;
  method: string;
  invoice_id?: number;
  created_date: string;
}

// Relationship Types

export interface Allocation {
  allocation_percentage: number;
  allocated_amount: number;
}

// Dashboard & Analytics Types

export interface DashboardStats {
  transactionCount: number;
  totalAmount: number;
  afeCount: number;
  deckCount: number;
  ownerCount: number;
  invoiceCount?: number;
  paymentCount?: number;
}

export interface AFEBudgetStatus extends AFE {
  spent: number;
  remaining: number;
  percentUsed: number;
}

export interface DeckSpending {
  deck_code: string;
  deck_description: string;
  deck_type: string;
  transaction_count: number;
  total_cost: number;
  avg_cost: number;
}

export interface OwnerAllocation {
  owner_name: string;
  owner_status: string;
  transaction_count: number;
  total_allocation: number;
  avg_percentage: number;
}

// Filter Types

export interface TransactionFilters {
  limit?: number;
  offset?: number;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  status?: string;
  category?: string;
}

export interface AFEFilters {
  status?: string;
  limit?: number;
  offset?: number;
}

// Graph Visualization Types

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: string;
  properties?: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Financial Flow Types

export interface FlowNode {
  name: string;
  category: string;
}

export interface FlowLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyData {
  nodes: FlowNode[];
  links: FlowLink[];
}

// Search Types

export interface SearchResult {
  id: string;
  type: string;
  label: string;
  description?: string;
  properties: Record<string, any>;
}

// API Response Types

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
