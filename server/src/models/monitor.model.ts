/**
 * Monitor model - database operations for monitors
 */
import { query, transaction } from '../config/database';
import { logger } from '../config/logger';
import type {
  IMonitor,
  IMonitorWithStats,
  ICreateMonitorRequest,
  IUpdateMonitorRequest,
  IMonitorFilters,
} from '@pulsewatch/shared';

/**
 * Find a monitor by ID
 */
export async function findById(id: string): Promise<IMonitor | null> {
  const result = await query<IMonitor>(
    'SELECT * FROM monitors WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Find a monitor by ID and verify ownership
 */
export async function findByIdAndUser(
  id: string,
  userId: string
): Promise<IMonitor | null> {
  const result = await query<IMonitor>(
    'SELECT * FROM monitors WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
    [id, userId]
  );
  return result.rows[0] || null;
}

/**
 * List monitors for a user with pagination and filters
 */
export async function listByUser(
  userId: string,
  filters: IMonitorFilters = {}
): Promise<{ monitors: IMonitorWithStats[]; total: number }> {
  const {
    status,
    type,
    search,
    page = 1,
    limit = 20,
    sort_by = 'created_at',
    sort_order = 'desc',
  } = filters;

  const offset = (page - 1) * limit;
  const conditions: string[] = ['m.user_id = $1', 'm.deleted_at IS NULL'];
  const params: any[] = [userId];
  let paramIndex = 2;

  if (status) {
    conditions.push(`m.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (type) {
    conditions.push(`m.type = $${paramIndex}`);
    params.push(type);
    paramIndex++;
  }

  if (search) {
    conditions.push(`(m.name ILIKE $${paramIndex} OR m.url ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Get total count
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM monitors m WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Get monitors with stats
  const validSortColumns = ['name', 'status', 'last_checked_at', 'created_at'];
  const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
  const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const queryParams = [...params, limit, offset];
  const monitorsResult = await query<IMonitorWithStats>(
    `
    SELECT 
      m.*,
      COALESCE(
        100.0 - (COUNT(DISTINCT c.id) FILTER (WHERE c.checked_at > NOW() - INTERVAL '24 hours' AND c.status = 'failure') * 100.0 / 
        NULLIF(COUNT(DISTINCT c.id) FILTER (WHERE c.checked_at > NOW() - INTERVAL '24 hours'), 0)),
        100.0
      ) as uptime_percentage_24h,
      COALESCE(
        100.0 - (COUNT(DISTINCT c.id) FILTER (WHERE c.checked_at > NOW() - INTERVAL '7 days' AND c.status = 'failure') * 100.0 / 
        NULLIF(COUNT(DISTINCT c.id) FILTER (WHERE c.checked_at > NOW() - INTERVAL '7 days'), 0)),
        100.0
      ) as uptime_percentage_7d,
      COALESCE(
        100.0 - (COUNT(DISTINCT c.id) FILTER (WHERE c.checked_at > NOW() - INTERVAL '30 days' AND c.status = 'failure') * 100.0 / 
        NULLIF(COUNT(DISTINCT c.id) FILTER (WHERE c.checked_at > NOW() - INTERVAL '30 days'), 0)),
        100.0
      ) as uptime_percentage_30d,
      COALESCE(AVG(c.response_time_ms) FILTER (WHERE c.checked_at > NOW() - INTERVAL '24 hours'), 0) as avg_response_time,
      COUNT(DISTINCT c.id) FILTER (WHERE c.checked_at > NOW() - INTERVAL '24 hours') as total_checks_24h,
      COUNT(DISTINCT c.id) FILTER (WHERE c.checked_at > NOW() - INTERVAL '24 hours' AND c.status = 'failure') as failed_checks_24h
    FROM monitors m
    LEFT JOIN checks c ON m.id = c.monitor_id
    WHERE ${whereClause}
    GROUP BY m.id
    ORDER BY m.${sortColumn} ${order}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
    queryParams
  );

  return { monitors: monitorsResult.rows, total };
}

/**
 * Create a new monitor
 */
export async function create(
  userId: string,
  data: ICreateMonitorRequest
): Promise<IMonitor> {
  const {
    name,
    url,
    type = 'https',
    method = 'GET',
    headers,
    body,
    interval = 300000,
    timeout = 30000,
    retries = 3,
    expected_status_code,
    expected_response_content,
    follow_redirects = true,
    verify_ssl = true,
    regions = ['us-east-1'],
  } = data;

  const result = await query<IMonitor>(
    `
    INSERT INTO monitors 
    (user_id, name, url, type, method, headers, body, interval, timeout, retries, 
     expected_status_code, expected_response_content, follow_redirects, verify_ssl, regions, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *
    `,
    [
      userId,
      name,
      url,
      type,
      method,
      headers ? JSON.stringify(headers) : null,
      body || null,
      interval,
      timeout,
      retries,
      expected_status_code || null,
      expected_response_content || null,
      follow_redirects,
      verify_ssl,
      regions,
      'pending',
    ]
  );

  logger.info({ monitorId: result.rows[0].id, userId }, 'Monitor created');
  return result.rows[0];
}

/**
 * Update a monitor
 */
export async function update(
  id: string,
  userId: string,
  updates: IUpdateMonitorRequest
): Promise<IMonitor | null> {
  const allowedFields = [
    'name',
    'url',
    'type',
    'method',
    'headers',
    'body',
    'interval',
    'timeout',
    'retries',
    'expected_status_code',
    'expected_response_content',
    'follow_redirects',
    'verify_ssl',
    'regions',
    'status',
  ];

  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      if (key === 'headers') {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value ? JSON.stringify(value) : null);
      } else {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
      }
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return findByIdAndUser(id, userId);
  }

  values.push(id, userId);
  const sql = `
    UPDATE monitors 
    SET ${setClauses.join(', ')} 
    WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} AND deleted_at IS NULL 
    RETURNING *
  `;

  const result = await query<IMonitor>(sql, values);
  return result.rows[0] || null;
}

/**
 * Update monitor status
 */
export async function updateStatus(
  id: string,
  status: string,
  consecutiveFailures: number = 0
): Promise<void> {
  await query(
    `
    UPDATE monitors 
    SET status = $1, 
        last_checked_at = NOW(),
        consecutive_failures = $2,
        last_status_change_at = CASE 
          WHEN status != $1 THEN NOW() 
          ELSE last_status_change_at 
        END
    WHERE id = $3
    `,
    [status, consecutiveFailures, id]
  );
}

/**
 * Soft delete a monitor
 */
export async function softDelete(id: string, userId: string): Promise<boolean> {
  const result = await query(
    'UPDATE monitors SET deleted_at = NOW(), is_active = FALSE WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
    [id, userId]
  );

  const deleted = result.rowCount > 0;
  if (deleted) {
    logger.info({ monitorId: id, userId }, 'Monitor soft deleted');
  }
  return deleted;
}

/**
 * Get monitors that need to be checked
 */
export async function getMonitorsToCheck(): Promise<IMonitor[]> {
  const result = await query<IMonitor>(
    `
    SELECT * FROM monitors 
    WHERE is_active = TRUE 
      AND deleted_at IS NULL
      AND (last_checked_at IS NULL OR 
           last_checked_at < NOW() - (interval || 'milliseconds')::INTERVAL)
    ORDER BY last_checked_at ASC NULLS FIRST
    LIMIT 100
    `
  );
  return result.rows;
}

/**
 * Count monitors by user
 */
export async function countByUser(userId: string): Promise<number> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) FROM monitors WHERE user_id = $1 AND deleted_at IS NULL',
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
}
