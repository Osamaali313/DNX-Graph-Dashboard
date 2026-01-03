/**
 * Data Fetching Script
 * Fetches all data from Neo4j and saves to static JSON files
 * Run this script whenever you want to refresh the dashboard data
 */

const neo4j = require('neo4j-driver');
const fs = require('fs');
const path = require('path');

// Neo4j connection
const driver = neo4j.driver(
  'neo4j://127.0.0.1:7687',
  neo4j.auth.basic('neo4j', 'password')
);

// Data directory
const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to save data
function saveData(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`✓ Saved ${filename} (${data.length || 'N/A'} items)`);
}

// Query functions
async function fetchDashboardStats() {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (t:Transaction)
      WITH count(t) as totalTransactions, sum(t.amount) as totalAmount
      MATCH (a:AFE)
      WHERE a.status = 'ACTIVE'
      WITH totalTransactions, totalAmount, count(a) as activeAFEs
      MATCH (o:Owner)
      WITH totalTransactions, totalAmount, activeAFEs, count(o) as totalOwners
      MATCH (d:Deck)
      WITH totalTransactions, totalAmount, activeAFEs, totalOwners, count(d) as totalDecks
      MATCH ()-[r]->()
      WITH totalTransactions, totalAmount, activeAFEs, totalOwners, totalDecks, count(r) as totalRelationships
      MATCH (t:Transaction)
      WHERE t.status = 'PENDING'
      WITH totalTransactions, totalAmount, activeAFEs, totalOwners, totalDecks, totalRelationships, count(t) as pendingTransactions
      MATCH (a:AFE)
      OPTIONAL MATCH (t:Transaction)-[:FUNDED_BY]->(a)
      RETURN totalTransactions, totalAmount, activeAFEs, totalOwners, totalDecks, totalRelationships, pendingTransactions,
             sum(a.total_budget) as totalBudget, sum(t.amount) as totalSpent
    `);

    const record = result.records[0];
    return {
      totalTransactions: record.get('totalTransactions').toNumber(),
      totalAmount: record.get('totalAmount'),
      activeAFEs: record.get('activeAFEs').toNumber(),
      totalOwners: record.get('totalOwners').toNumber(),
      totalDecks: record.get('totalDecks').toNumber(),
      totalRelationships: record.get('totalRelationships').toNumber(),
      pendingTransactions: record.get('pendingTransactions').toNumber(),
      afeBudgetSummary: {
        totalBudget: record.get('totalBudget') || 0,
        totalSpent: record.get('totalSpent') || 0,
        remaining: (record.get('totalBudget') || 0) - (record.get('totalSpent') || 0),
      },
    };
  } finally {
    await session.close();
  }
}

async function fetchTransactions() {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (t:Transaction)
      OPTIONAL MATCH (t)-[:CHARGED_TO]->(d:Deck)
      OPTIONAL MATCH (t)-[:FUNDED_BY]->(a:AFE)
      OPTIONAL MATCH (t)-[:CATEGORIZED_AS]->(bc:BillingCategory)
      OPTIONAL MATCH (t)-[alloc:ALLOCATED_TO]->(o:Owner)
      RETURN t.txn_id as txnId, t.txn_date as txnDate, t.amount as amount,
             t.description as description, t.status as status,
             d.deck_id as deckId, d.deck_code as deckCode,
             a.afe_id as afeId, a.afe_number as afeNumber,
             bc.bill_cat_code as billingCategory,
             collect({
               ownerId: o.owner_id,
               ownerName: o.owner_name,
               allocationPercentage: alloc.allocation_percentage,
               allocatedAmount: alloc.allocated_amount
             }) as owners
      ORDER BY t.txn_date DESC
      LIMIT 200
    `);

    return result.records.map((record) => {
      const txnDate = record.get('txnDate');
      let dateString = null;

      if (txnDate) {
        // Handle Neo4j DateTime object
        if (txnDate.year && txnDate.month && txnDate.day) {
          const year = txnDate.year.low || txnDate.year;
          const month = String(txnDate.month.low || txnDate.month).padStart(2, '0');
          const day = String(txnDate.day.low || txnDate.day).padStart(2, '0');
          dateString = `${year}-${month}-${day}`;
        } else if (typeof txnDate === 'string') {
          dateString = txnDate;
        }
      }

      // Process owners array
      const owners = record.get('owners') || [];
      const processedOwners = owners
        .filter((owner) => owner.ownerId !== null)
        .map((owner) => ({
          ownerId: owner.ownerId?.toNumber ? owner.ownerId.toNumber() : owner.ownerId,
          ownerName: owner.ownerName,
          allocationPercentage: owner.allocationPercentage || 0,
          allocatedAmount: owner.allocatedAmount || 0,
        }));

      return {
        txnId: record.get('txnId')?.toNumber(),
        txnDate: dateString,
        amount: record.get('amount'),
        description: record.get('description'),
        status: record.get('status') || 'POSTED',
        deckId: record.get('deckId')?.toNumber(),
        deckCode: record.get('deckCode'),
        afeId: record.get('afeId')?.toNumber(),
        afeNumber: record.get('afeNumber'),
        billingCategory: record.get('billingCategory'),
        owners: processedOwners,
      };
    });
  } finally {
    await session.close();
  }
}

async function fetchAFEs() {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (a:AFE)
      OPTIONAL MATCH (t:Transaction)-[:FUNDED_BY]->(a)
      RETURN a.afe_id as afeId, a.afe_number as afeNumber, a.description as description,
             a.status as status, a.total_budget as totalBudget,
             a.project_code as projectCode, a.objective_code as objectiveCode,
             sum(t.amount) as totalSpent
      ORDER BY a.afe_number
    `);

    return result.records.map((record) => ({
      afeId: record.get('afeId')?.toNumber(),
      afeNumber: record.get('afeNumber'),
      description: record.get('description'),
      status: record.get('status') || 'ACTIVE',
      totalBudget: record.get('totalBudget') || 0,
      totalSpent: record.get('totalSpent') || 0,
      projectCode: record.get('projectCode'),
      objectiveCode: record.get('objectiveCode'),
    }));
  } finally {
    await session.close();
  }
}

async function fetchDecks() {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (d:Deck)
      OPTIONAL MATCH (t:Transaction)-[:CHARGED_TO]->(d)
      RETURN d.deck_id as deckId, d.deck_code as deckCode, d.description as description,
             d.deck_type as deckType, count(t) as transactionCount, sum(t.amount) as totalSpent
      ORDER BY d.deck_code
    `);

    return result.records.map((record) => ({
      deckId: record.get('deckId')?.toNumber(),
      deckCode: record.get('deckCode'),
      description: record.get('description'),
      deckType: record.get('deckType'),
      transactionCount: record.get('transactionCount').toNumber(),
      totalSpent: record.get('totalSpent') || 0,
    }));
  } finally {
    await session.close();
  }
}

async function fetchOwners() {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (o:Owner)
      OPTIONAL MATCH (t:Transaction)-[a:ALLOCATED_TO]->(o)
      RETURN o.owner_id as ownerId, o.owner_name as ownerName,
             o.interest_type_code as interestTypeCode, o.owner_status as ownerStatus,
             count(a) as allocationCount, avg(a.allocation_percentage) as avgAllocationPercentage,
             sum(a.allocated_amount) as totalRevenue
      ORDER BY o.owner_name
    `);

    return result.records.map((record) => ({
      ownerId: record.get('ownerId')?.toNumber(),
      ownerName: record.get('ownerName'),
      interestTypeCode: record.get('interestTypeCode'),
      ownerStatus: record.get('ownerStatus'),
      allocationCount: record.get('allocationCount').toNumber(),
      avgAllocationPercentage: record.get('avgAllocationPercentage') || 0,
      totalRevenue: record.get('totalRevenue') || 0,
    }));
  } finally {
    await session.close();
  }
}

async function fetchFlowData() {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (t:Transaction)
      OPTIONAL MATCH (t)-[:CHARGED_TO]->(d:Deck)
      OPTIONAL MATCH (t)-[:FUNDED_BY]->(a:AFE)
      OPTIONAL MATCH (t)-[:CATEGORIZED_AS]->(bc:BillingCategory)
      RETURN t.txn_id as txnId, t.txn_date as txnDate, t.amount as amount,
             d.deck_code as deckCode, a.afe_number as afeNumber, bc.bill_cat_code as billingCategory
      ORDER BY t.txn_date DESC
      LIMIT 500
    `);

    return {
      transactions: result.records.map((record) => {
        const txnDate = record.get('txnDate');
        let dateString = null;

        if (txnDate) {
          if (txnDate.year && txnDate.month && txnDate.day) {
            const year = txnDate.year.low || txnDate.year;
            const month = String(txnDate.month.low || txnDate.month).padStart(2, '0');
            const day = String(txnDate.day.low || txnDate.day).padStart(2, '0');
            dateString = `${year}-${month}-${day}`;
          } else if (typeof txnDate === 'string') {
            dateString = txnDate;
          }
        }

        return {
          txnId: record.get('txnId')?.toNumber(),
          txnDate: dateString,
          amount: record.get('amount'),
          deckCode: record.get('deckCode'),
          afeNumber: record.get('afeNumber'),
          billingCategory: record.get('billingCategory'),
        };
      }),
    };
  } finally {
    await session.close();
  }
}

async function fetchNetworkDataForLevel(level) {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (n)
      WHERE n:Transaction OR n:AFE OR n:Deck OR n:Owner OR n:BillingCategory
      WITH n LIMIT 100
      OPTIONAL MATCH path = (n)-[r*1..${level}]-(m)
      WHERE m:Transaction OR m:AFE OR m:Deck OR m:Owner OR m:BillingCategory
      WITH n, relationships(path) as rels, m
      UNWIND rels as rel
      RETURN DISTINCT
        id(startNode(rel)) as sourceId, labels(startNode(rel))[0] as sourceType,
        coalesce(
          toString(startNode(rel).txn_id),
          startNode(rel).afe_number,
          startNode(rel).deck_code,
          startNode(rel).owner_name,
          startNode(rel).bill_cat_code,
          'Unknown'
        ) as sourceLabel,
        id(endNode(rel)) as targetId, labels(endNode(rel))[0] as targetType,
        coalesce(
          toString(endNode(rel).txn_id),
          endNode(rel).afe_number,
          endNode(rel).deck_code,
          endNode(rel).owner_name,
          endNode(rel).bill_cat_code,
          'Unknown'
        ) as targetLabel,
        type(rel) as relType
    `);

    const nodes = new Map();
    const edges = [];

    result.records.forEach((record) => {
      const sourceId = record.get('sourceId')?.toString();
      const targetId = record.get('targetId')?.toString();

      if (sourceId) {
        nodes.set(sourceId, {
          id: sourceId,
          type: record.get('sourceType'),
          label: record.get('sourceLabel')?.toString() || 'Unknown',
        });
      }

      if (targetId) {
        nodes.set(targetId, {
          id: targetId,
          type: record.get('targetType'),
          label: record.get('targetLabel')?.toString() || 'Unknown',
        });

        edges.push({
          source: sourceId,
          target: targetId,
          type: record.get('relType'),
        });
      }
    });

    return {
      nodes: Array.from(nodes.values()),
      edges,
    };
  } finally {
    await session.close();
  }
}

async function fetchNetworkData() {
  console.log('  Fetching network data for all levels...');
  const [level1, level2, level3] = await Promise.all([
    fetchNetworkDataForLevel(1),
    fetchNetworkDataForLevel(2),
    fetchNetworkDataForLevel(3),
  ]);

  return { level1, level2, level3 };
}

// Main execution
async function main() {
  console.log('🚀 Starting data fetch from Neo4j...\n');

  try {
    // Verify connection
    await driver.verifyConnectivity();
    console.log('✓ Connected to Neo4j\n');

    // Fetch all data
    console.log('Fetching data...');
    const [stats, transactions, afes, decks, owners, flowData, networkData] = await Promise.all([
      fetchDashboardStats(),
      fetchTransactions(),
      fetchAFEs(),
      fetchDecks(),
      fetchOwners(),
      fetchFlowData(),
      fetchNetworkData(),
    ]);

    // Save all data
    console.log('\nSaving data files...');
    saveData('dashboard-stats.json', stats);
    saveData('transactions.json', transactions);
    saveData('afes.json', afes);
    saveData('decks.json', decks);
    saveData('owners.json', owners);
    saveData('flow-data.json', flowData);
    saveData('network-data.json', networkData);

    // Save metadata
    const metadata = {
      lastUpdated: new Date().toISOString(),
      totalTransactions: transactions.length,
      totalAFEs: afes.length,
      totalDecks: decks.length,
      totalOwners: owners.length,
      totalNodes: networkData.level3?.nodes?.length || 0,
      totalEdges: networkData.level3?.edges?.length || 0,
    };
    saveData('metadata.json', metadata);

    console.log('\n✅ Data fetch complete!');
    console.log(`   Last updated: ${metadata.lastUpdated}`);
    console.log(`   Transactions: ${metadata.totalTransactions}`);
    console.log(`   AFEs: ${metadata.totalAFEs}`);
    console.log(`   Decks: ${metadata.totalDecks}`);
    console.log(`   Owners: ${metadata.totalOwners}`);
    console.log(`   Graph nodes (level 3): ${metadata.totalNodes}`);
    console.log(`   Graph edges (level 3): ${metadata.totalEdges}`);
  } catch (error) {
    console.error('❌ Error fetching data:', error);
    process.exit(1);
  } finally {
    await driver.close();
  }
}

main();
