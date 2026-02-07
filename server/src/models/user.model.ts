/**
 * User model - database operations for users
 */
import { query, transaction } from '../config/database';
import { logger } from '../config/logger';
import type { IUser, IUserProfile, IUserSettings, ICreateUserRequest } from '@pulsewatch/shared';

/**
 * Find a user by ID
 */
export async function findById(id: string): Promise<IUser | null> {
  const result = await query<IUser>(
    'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Find a user by email
 */
export async function findByEmail(email: string): Promise<IUser | null> {
  const result = await query<IUser>(
    'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
    [email.toLowerCase()]
  );
  return result.rows[0] || null;
}

/**
 * Create a new user
 */
export async function create(userData: ICreateUserRequest & { password_hash: string }): Promise<IUser> {
  const { email, password_hash, first_name, last_name, timezone } = userData;

  const result = await query<IUser>(
    `INSERT INTO users (email, password_hash, first_name, last_name, timezone)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [email.toLowerCase(), password_hash, first_name || null, last_name || null, timezone || 'UTC']
  );

  logger.info({ userId: result.rows[0].id }, 'User created');
  return result.rows[0];
}

/**
 * Update a user
 */
export async function update(
  id: string,
  updates: Partial<Pick<IUser, 'first_name' | 'last_name' | 'avatar_url' | 'timezone' | 'is_active'>>
): Promise<IUser | null> {
  const allowedFields = ['first_name', 'last_name', 'avatar_url', 'timezone', 'is_active'];
  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return findById(id);
  }

  values.push(id);
  const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex} AND deleted_at IS NULL RETURNING *`;

  const result = await query<IUser>(sql, values);
  return result.rows[0] || null;
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(id: string): Promise<void> {
  await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [id]);
}

/**
 * Mark email as verified
 */
export async function markEmailVerified(id: string): Promise<void> {
  await query(
    'UPDATE users SET is_email_verified = TRUE, email_verified_at = NOW() WHERE id = $1',
    [id]
  );
  logger.info({ userId: id }, 'Email verified');
}

/**
 * Update password
 */
export async function updatePassword(id: string, password_hash: string): Promise<void> {
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, id]);
  logger.info({ userId: id }, 'Password updated');
}

/**
 * Soft delete a user
 */
export async function softDelete(id: string): Promise<void> {
  await query('UPDATE users SET deleted_at = NOW(), is_active = FALSE WHERE id = $1', [id]);
  logger.info({ userId: id }, 'User soft deleted');
}

/**
 * Get user profile (without sensitive data)
 */
export function getUserProfile(user: IUser): IUserProfile {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    avatar_url: user.avatar_url,
    timezone: user.timezone,
    is_email_verified: user.is_email_verified,
    created_at: user.created_at,
    last_login_at: user.last_login_at,
  };
}

/**
 * Get user settings
 */
export async function getSettings(userId: string): Promise<IUserSettings | null> {
  const result = await query<IUserSettings>(
    'SELECT * FROM user_settings WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Update user settings
 */
export async function updateSettings(
  userId: string,
  updates: Partial<Omit<IUserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<IUserSettings | null> {
  const allowedFields = [
    'notification_email',
    'notification_webhook',
    'notification_browser',
    'webhook_url',
    'alert_threshold_minutes',
    'theme',
  ];

  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return getSettings(userId);
  }

  values.push(userId);
  const sql = `UPDATE user_settings SET ${setClauses.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`;

  const result = await query<IUserSettings>(sql, values);
  return result.rows[0] || null;
}

/**
 * Check if email exists
 */
export async function emailExists(email: string): Promise<boolean> {
  const result = await query('SELECT 1 FROM users WHERE email = $1 AND deleted_at IS NULL', [
    email.toLowerCase(),
  ]);
  return result.rowCount > 0;
}
