/**
 * Database reset utility - drops and recreates all tables
 * WARNING: This will delete all data!
 */
import { pool, query } from '../config/database';
import { logger } from '../config/logger';

/**
 * Reset the database by dropping all tables
 */
async function reset(): Promise<void> {
  try {
    logger.warn('Starting database reset...');

    // Drop all tables in reverse order of dependencies
    const tables = [
      'webhook_deliveries',
      'audit_logs',
      'status_page_monitors',
      'status_pages',
      'notification_preferences',
      'notifications',
      'incidents',
      'checks',
      'monitors',
      'refresh_tokens',
      'email_verification_tokens',
      'password_reset_tokens',
      'user_settings',
      'users',
      'schema_migrations',
    ];

    for (const table of tables) {
      await query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      logger.info(`Dropped table: ${table}`);
    }

    // Drop views
    const views = ['monitor_stats'];
    for (const view of views) {
      await query(`DROP VIEW IF EXISTS ${view} CASCADE`);
      logger.info(`Dropped view: ${view}`);
    }

    // Drop functions
    const functions = ['update_updated_at_column', 'create_default_user_settings'];
    for (const func of functions) {
      await query(`DROP FUNCTION IF EXISTS ${func} CASCADE`);
      logger.info(`Dropped function: ${func}`);
    }

    logger.info('Database reset completed');
  } catch (error) {
    logger.error('Database reset failed:', error);
    process.exit(1);
  }
}

// Run reset if this file is executed directly
if (require.main === module) {
  reset().then(() => process.exit(0));
}

export { reset };
