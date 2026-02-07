/**
 * Database migration runner
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { pool, query } from '../config/database';
import { logger } from '../config/logger';

const MIGRATIONS_DIR = __dirname;

interface Migration {
  id: number;
  filename: string;
  executed_at: Date;
}

/**
 * Create migrations table if it doesn't exist
 */
async function createMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

/**
 * Get list of executed migrations
 */
async function getExecutedMigrations(): Promise<string[]> {
  const result = await query<Migration>('SELECT filename FROM schema_migrations ORDER BY id');
  return result.rows.map((row) => row.filename);
}

/**
 * Record a migration as executed
 */
async function recordMigration(filename: string): Promise<void> {
  await query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
}

/**
 * Execute a single migration file
 */
async function executeMigration(filename: string): Promise<void> {
  const filepath = join(MIGRATIONS_DIR, filename);
  const sql = readFileSync(filepath, 'utf-8');

  logger.info(`Executing migration: ${filename}`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await recordMigration(filename);
    await client.query('COMMIT');
    logger.info(`Migration completed: ${filename}`);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Migration failed: ${filename}`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Run all pending migrations
 */
async function migrate(): Promise<void> {
  try {
    await createMigrationsTable();

    const executedMigrations = await getExecutedMigrations();
    const allFiles = readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    const pendingMigrations = allFiles.filter(
      (file) => !executedMigrations.includes(file)
    );

    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations');
      return;
    }

    logger.info(`Found ${pendingMigrations.length} pending migrations`);

    for (const migration of pendingMigrations) {
      await executeMigration(migration);
    }

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  migrate().then(() => process.exit(0));
}

export { migrate };
