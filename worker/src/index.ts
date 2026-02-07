/**
 * PulseWatch Monitoring Worker
 * Background job processor for health checks
 */
import dotenv from 'dotenv';
import { Pool } from 'pg';
import Redis from 'ioredis';
import pino from 'pino';

// Load environment variables
dotenv.config({ path: '../.env' });

// Logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  },
});

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'pulsewatch',
  password: process.env.DB_PASSWORD || 'pulsewatch_secret',
  database: process.env.DB_NAME || 'pulsewatch',
});

// Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || 'redis_secret',
});

/**
 * Main worker loop
 * Polls for monitors that need to be checked
 */
async function workerLoop() {
  logger.info('Worker started');

  while (true) {
    try {
      // Get monitors that need to be checked
      const result = await pool.query(`
        SELECT * FROM monitors 
        WHERE is_active = TRUE 
          AND deleted_at IS NULL
          AND (last_checked_at IS NULL OR 
               last_checked_at < NOW() - (interval || 'milliseconds')::INTERVAL)
        ORDER BY last_checked_at ASC NULLS FIRST
        LIMIT 10
      `);

      const monitors = result.rows;

      if (monitors.length === 0) {
        logger.debug('No monitors to check, waiting...');
        await sleep(5000); // Wait 5 seconds before checking again
        continue;
      }

      logger.info(`Checking ${monitors.length} monitors`);

      // Process each monitor
      for (const monitor of monitors) {
        try {
          await checkMonitor(monitor);
        } catch (error) {
          logger.error({ monitorId: monitor.id, error }, 'Failed to check monitor');
        }
      }

      // Small delay to prevent tight looping
      await sleep(1000);
    } catch (error) {
      logger.error('Worker loop error:', error);
      await sleep(5000);
    }
  }
}

/**
 * Perform a health check on a monitor
 */
async function checkMonitor(monitor: any) {
  const startTime = Date.now();
  const region = 'us-east-1'; // TODO: Make configurable

  logger.debug({ monitorId: monitor.id, url: monitor.url }, 'Checking monitor');

  try {
    // Import axios dynamically to avoid issues
    const axios = (await import('axios')).default;

    const response = await axios({
      method: monitor.method,
      url: monitor.url,
      headers: monitor.headers ? JSON.parse(monitor.headers) : {},
      data: monitor.body || undefined,
      timeout: monitor.timeout,
      maxRedirects: monitor.follow_redirects ? 5 : 0,
      validateStatus: () => true, // Don't throw on error status codes
      httpsAgent: monitor.verify_ssl ? undefined : new (require('https').Agent)({ rejectUnauthorized: false }),
    });

    const responseTime = Date.now() - startTime;
    const statusCode = response.status;

    // Determine if check was successful
    let status: 'success' | 'failure' = 'success';
    let errorMessage: string | null = null;

    // Check status code
    if (monitor.expected_status_code && statusCode !== monitor.expected_status_code) {
      status = 'failure';
      errorMessage = `Expected status ${monitor.expected_status_code}, got ${statusCode}`;
    }

    // Check response content
    if (status === 'success' && monitor.expected_response_content) {
      const responseText = typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data);

      if (!responseText.includes(monitor.expected_response_content)) {
        status = 'failure';
        errorMessage = 'Expected response content not found';
      }
    }

    // Store check result
    await storeCheckResult({
      monitor_id: monitor.id,
      status,
      response_time_ms: responseTime,
      status_code: statusCode,
      response_body: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
      response_headers: response.headers,
      error_message: errorMessage,
      region,
    });

    // Update monitor status
    await updateMonitorStatus(monitor, status);

    logger.debug({
      monitorId: monitor.id,
      status,
      responseTime,
      statusCode,
    }, 'Monitor check completed');

  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    // Store failed check
    await storeCheckResult({
      monitor_id: monitor.id,
      status: 'error',
      response_time_ms: responseTime,
      status_code: null,
      response_body: null,
      response_headers: null,
      error_message: error.message || 'Request failed',
      region,
    });

    // Update monitor status
    await updateMonitorStatus(monitor, 'error');

    logger.debug({
      monitorId: monitor.id,
      error: error.message,
    }, 'Monitor check failed');
  }
}

/**
 * Store check result in database
 */
async function storeCheckResult(check: {
  monitor_id: string;
  status: string;
  response_time_ms: number;
  status_code: number | null;
  response_body: string | null;
  response_headers: any;
  error_message: string | null;
  region: string;
}) {
  await pool.query(`
    INSERT INTO checks 
    (monitor_id, status, response_time_ms, status_code, response_body, response_headers, error_message, region, checked_at)
    VALUES ($1, $2::varchar, $3, $4, $5, $6, $7, $8::varchar, NOW())
  `, [
    check.monitor_id,
    check.status,
    check.response_time_ms,
    check.status_code,
    check.response_body,
    check.response_headers ? JSON.stringify(check.response_headers) : null,
    check.error_message,
    check.region,
  ]);
}

/**
 * Update monitor status based on check results
 */
async function updateMonitorStatus(monitor: any, checkStatus: string) {
  // Determine new monitor status
  let newStatus = monitor.status;
  let consecutiveFailures = monitor.consecutive_failures || 0;

  if (checkStatus === 'success') {
    consecutiveFailures = 0;
    newStatus = 'up';
  } else {
    consecutiveFailures++;
    // Only mark as down after 3 consecutive failures (configurable)
    if (consecutiveFailures >= (monitor.retries || 3)) {
      newStatus = 'down';
    }
  }

  await pool.query(`
    UPDATE monitors 
    SET status = $1::varchar,
        last_checked_at = NOW(),
        consecutive_failures = $2,
        last_status_change_at = CASE 
          WHEN status != $1::varchar THEN NOW() 
          ELSE last_status_change_at 
        END
    WHERE id = $3
  `, [newStatus, consecutiveFailures, monitor.id]);

  // TODO: Trigger alerts if status changed to down
  if (newStatus === 'down' && monitor.status !== 'down') {
    logger.info({ monitorId: monitor.id }, 'Monitor went down, triggering alert');
    // await triggerAlert(monitor);
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Graceful shutdown
 */
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  await pool.end();
  await redis.quit();
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start worker
workerLoop().catch(error => {
  logger.fatal('Worker crashed:', error);
  process.exit(1);
});
