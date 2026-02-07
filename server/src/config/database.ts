/**
 * Database configuration and connection pool
 */
import { Pool, PoolConfig, QueryResult } from 'pg';
import { logger } from './logger';

// Database configuration
const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'pulsewatch',
  password: process.env.DB_PASSWORD || 'pulsewatch_secret',
  database: process.env.DB_NAME || 'pulsewatch',
  // Pool configuration
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection not established
};

// Create the connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected database pool error:', err);
  process.exit(-1);
});

// Log successful connection
pool.on('connect', () => {
  logger.debug('New database connection established');
});

/**
 * Execute a SQL query with parameters
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    logger.debug({ query: text, duration, rows: result.rowCount }, 'Database query executed');
    return result;
  } catch (error) {
    logger.error({ query: text, error }, 'Database query failed');
    throw error;
  }
}

/**
 * Execute a transaction with multiple queries
 */
export async function transaction<T>(
  callback: (client: Pool) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get a client from the pool for manual transaction management
 */
export async function getClient() {
  return await pool.connect();
}

/**
 * Check database health
 */
export async function checkHealth(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Close the pool gracefully
 */
export async function closePool(): Promise<void> {
  logger.info('Closing database pool...');
  await pool.end();
  logger.info('Database pool closed');
}

export { pool };
