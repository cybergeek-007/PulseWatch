/**
 * Database seeder for development
 */
import bcrypt from 'bcrypt';
import { query } from '../config/database';
import { logger } from '../config/logger';

/**
 * Seed the database with test data
 */
async function seed(): Promise<void> {
  try {
    logger.info('Starting database seed...');

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const userResult = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, is_email_verified, timezone)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['test@pulsewatch.io', hashedPassword, 'Test', 'User', true, 'UTC']
    );

    let userId = userResult.rows[0]?.id;

    // If user already exists, get the ID
    if (!userId) {
      const existingUser = await query('SELECT id FROM users WHERE email = $1', [
        'test@pulsewatch.io',
      ]);
      userId = existingUser.rows[0].id;
      logger.info('Test user already exists');
    } else {
      logger.info('Created test user');
    }

    // Create sample monitors
    const monitors = [
      {
        name: 'Google API',
        url: 'https://www.google.com',
        type: 'https',
        method: 'GET',
        interval: 300000,
        expected_status_code: 200,
      },
      {
        name: 'GitHub API',
        url: 'https://api.github.com',
        type: 'https',
        method: 'GET',
        interval: 300000,
        expected_status_code: 200,
      },
      {
        name: 'JSONPlaceholder',
        url: 'https://jsonplaceholder.typicode.com/posts',
        type: 'https',
        method: 'GET',
        interval: 60000,
        expected_status_code: 200,
      },
    ];

    for (const monitor of monitors) {
      const monitorResult = await query(
        `INSERT INTO monitors 
         (user_id, name, url, type, method, interval, expected_status_code, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [
          userId,
          monitor.name,
          monitor.url,
          monitor.type,
          monitor.method,
          monitor.interval,
          monitor.expected_status_code,
          'pending',
        ]
      );

      if (monitorResult.rows[0]) {
        logger.info(`Created monitor: ${monitor.name}`);
      }
    }

    logger.info('Database seed completed');
  } catch (error) {
    logger.error('Database seed failed:', error);
    process.exit(1);
  }
}

// Run seeder if this file is executed directly
if (require.main === module) {
  seed().then(() => process.exit(0));
}

export { seed };
