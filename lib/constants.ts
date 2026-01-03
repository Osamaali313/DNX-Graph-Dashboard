// Application Constants

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'DataNexum Financial Dashboard';
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Interactive financial graph database visualization';

// Pagination
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

// Chart Colors
export const CHART_COLORS = {
  primary: '#3b82f6', // blue-500
  secondary: '#8b5cf6', // violet-500
  success: '#10b981', // green-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444', // red-500
  info: '#06b6d4', // cyan-500
};

// Node Type Colors (for graph visualization)
export const NODE_COLORS: Record<string, string> = {
  Transaction: '#3b82f6', // blue
  AFE: '#8b5cf6', // violet
  Deck: '#10b981', // green
  BillingCategory: '#f59e0b', // amber
  Owner: '#ef4444', // red
  Invoice: '#06b6d4', // cyan
  Payment: '#ec4899', // pink
};

// Status Colors
export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#10b981', // green
  APPROVED: '#10b981',
  PAID: '#10b981',
  CLEARED: '#10b981',

  PENDING: '#f59e0b', // amber

  INACTIVE: '#6b7280', // gray
  REJECTED: '#ef4444', // red
  VOID: '#ef4444',
  CLOSED: '#6b7280',
};

// Transaction Statuses
export const TRANSACTION_STATUSES = [
  'APPROVED',
  'PENDING',
  'REJECTED',
  'POSTED',
] as const;

// AFE Statuses
export const AFE_STATUSES = [
  'ACTIVE',
  'CLOSED',
  'PENDING',
  'APPROVED',
] as const;

// Deck Types
export const DECK_TYPES = [
  'OPERATING',
  'CAPITAL',
  'OVERHEAD',
  'REVENUE',
] as const;

// Owner Statuses
export const OWNER_STATUSES = [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
] as const;

// Navigation Menu Items
export const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/schema', label: 'Schema', icon: 'Database' },
  { href: '/graph', label: 'Graph', icon: 'Network' },
  { href: '/relationships', label: 'Relationships', icon: 'GitBranch' },
  { href: '/validation', label: 'Validation', icon: 'CheckCircle2' },
  { href: '/transactions', label: 'Transactions', icon: 'Receipt' },
  { href: '/afes', label: 'AFE Tracker', icon: 'Target' },
  { href: '/decks', label: 'Cost Centers', icon: 'Building2' },
  { href: '/owners', label: 'Ownership', icon: 'Users' },
  { href: '/flow', label: 'Financial Flow', icon: 'TrendingUp' },
  { href: '/query', label: 'Query Builder', icon: 'Code2' },
  { href: '/reports', label: 'Reports', icon: 'FileText' },
] as const;

// Format Options
export const CURRENCY_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const NUMBER_FORMAT = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const PERCENT_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
