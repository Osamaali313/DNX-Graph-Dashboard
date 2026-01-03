import neo4j, { Driver, Session } from 'neo4j-driver';

let driver: Driver | null = null;

/**
 * Get or create Neo4j driver instance (singleton pattern)
 */
export function getDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI || 'neo4j://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'password';

    if (!password || password === 'your_password_here') {
      throw new Error('NEO4J_PASSWORD not configured in environment variables');
    }

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
    });
  }

  return driver;
}

/**
 * Execute a read query (for SELECT-like operations)
 */
export async function executeReadQuery<T = any>(
  query: string,
  parameters?: Record<string, any>
): Promise<T[]> {
  const driver = getDriver();
  const session: Session = driver.session({ database: 'neo4j' });

  try {
    const result = await session.executeRead((tx) =>
      tx.run(query, parameters || {})
    );

    return result.records.map((record) => record.toObject() as T);
  } catch (error) {
    console.error('Neo4j read query error:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Execute a write query (for CREATE/UPDATE/DELETE operations)
 */
export async function executeWriteQuery<T = any>(
  query: string,
  parameters?: Record<string, any>
): Promise<T[]> {
  const driver = getDriver();
  const session: Session = driver.session({ database: 'neo4j' });

  try {
    const result = await session.executeWrite((tx) =>
      tx.run(query, parameters || {})
    );

    return result.records.map((record) => record.toObject() as T);
  } catch (error) {
    console.error('Neo4j write query error:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Execute any query (auto-detects read/write)
 */
export async function executeQuery<T = any>(
  query: string,
  parameters?: Record<string, any>
): Promise<T[]> {
  // Simple heuristic: if query starts with CREATE, MERGE, SET, DELETE, use write
  const trimmedQuery = query.trim().toUpperCase();
  const isWrite = ['CREATE', 'MERGE', 'SET', 'DELETE', 'REMOVE'].some((keyword) =>
    trimmedQuery.startsWith(keyword)
  );

  return isWrite
    ? executeWriteQuery<T>(query, parameters)
    : executeReadQuery<T>(query, parameters);
}

/**
 * Close the Neo4j driver (call on app shutdown)
 */
export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

/**
 * Test Neo4j connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await executeReadQuery<{ test: number }>(
      'RETURN 1 as test'
    );
    return result.length > 0 && result[0].test === 1;
  } catch (error) {
    console.error('Neo4j connection test failed:', error);
    return false;
  }
}
