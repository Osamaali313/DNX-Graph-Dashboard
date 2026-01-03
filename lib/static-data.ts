/**
 * Static Data Helper
 * Reads pre-fetched data from JSON files instead of querying Neo4j
 */

import dashboardStats from '@/data/dashboard-stats.json';
import transactions from '@/data/transactions.json';
import afes from '@/data/afes.json';
import decks from '@/data/decks.json';
import owners from '@/data/owners.json';
import flowData from '@/data/flow-data.json';
import networkData from '@/data/network-data.json';
import metadata from '@/data/metadata.json';

// Dashboard stats
export function getStaticDashboardStats() {
  return dashboardStats;
}

// Transactions
export function getStaticTransactions(filters?: any) {
  let filtered = [...transactions];

  if (filters?.status) {
    filtered = filtered.filter((t: any) => t.status === filters.status);
  }

  if (filters?.minAmount) {
    filtered = filtered.filter((t: any) => t.amount >= filters.minAmount);
  }

  if (filters?.maxAmount) {
    filtered = filtered.filter((t: any) => t.amount <= filters.maxAmount);
  }

  return filtered;
}

export function getStaticTransactionById(id: string) {
  return transactions.find((t: any) => t.txnId?.toString() === id);
}

// AFEs
export function getStaticAFEs() {
  return afes;
}

export function getStaticAFEById(id: string) {
  return afes.find((a: any) => a.afeId?.toString() === id);
}

// Decks
export function getStaticDecks() {
  return decks;
}

export function getStaticDeckById(id: string) {
  return decks.find((d: any) => d.deckId?.toString() === id);
}

// Owners
export function getStaticOwners() {
  return owners;
}

export function getStaticOwnerById(id: string) {
  return owners.find((o: any) => o.ownerId?.toString() === id);
}

// Flow data
export function getStaticFlowData() {
  return flowData;
}

// Network data - with level support
export function getStaticNetworkData(depth: number = 2) {
  // networkData now contains { level1, level2, level3 }
  if (depth === 1 && (networkData as any).level1) {
    return (networkData as any).level1;
  } else if (depth === 2 && (networkData as any).level2) {
    return (networkData as any).level2;
  } else if (depth === 3 && (networkData as any).level3) {
    return (networkData as any).level3;
  }
  // Fallback to level2 or entire structure
  return (networkData as any).level2 || networkData;
}

// Metadata
export function getStaticMetadata() {
  return metadata;
}

// Get transactions for a specific deck
export function getTransactionsForDeck(deckId: string) {
  return transactions.filter((t: any) => t.deckId?.toString() === deckId);
}

// Get transactions for a specific AFE
export function getTransactionsForAFE(afeId: string) {
  return transactions.filter((t: any) => t.afeId?.toString() === afeId);
}

// Get transactions for a specific owner
export function getTransactionsForOwner(ownerId: string) {
  // This would need owner allocations in the data
  return [];
}
