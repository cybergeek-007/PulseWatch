/**
 * Token model - database operations for refresh tokens, password reset tokens, etc.
 */
import { query } from '../config/database';
import { logger } from '../config/logger';

// ============================================
// REFRESH TOKENS
// ============================================

/**
 * Create a new refresh token
 */
export async function createRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
  createdByIp?: string
): Promise<void> {
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, created_by_ip)
     VALUES ($1, $2, $3, $4)`,
    [userId, tokenHash, expiresAt, createdByIp || null]
  );
}

/**
 * Find a refresh token by hash
 */
export async function findRefreshToken(tokenHash: string): Promise<any | null> {
  const result = await query(
    `SELECT rt.*, u.id as user_id, u.email, u.is_active, u.is_email_verified
     FROM refresh_tokens rt
     JOIN users u ON rt.user_id = u.id
     WHERE rt.token_hash = $1 AND rt.revoked_at IS NULL AND rt.expires_at > NOW()`,
    [tokenHash]
  );
  return result.rows[0] || null;
}

/**
 * Revoke a refresh token
 */
export async function revokeRefreshToken(
  tokenHash: string,
  revokedByIp?: string
): Promise<void> {
  await query(
    `UPDATE refresh_tokens 
     SET revoked_at = NOW(), revoked_by_ip = $2
     WHERE token_hash = $1`,
    [tokenHash, revokedByIp || null]
  );
  logger.info('Refresh token revoked');
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await query(
    `UPDATE refresh_tokens 
     SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
  logger.info({ userId }, 'All refresh tokens revoked for user');
}

// ============================================
// PASSWORD RESET TOKENS
// ============================================

/**
 * Create a password reset token
 */
export async function createPasswordResetToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<void> {
  // Invalidate any existing tokens for this user
  await query(
    `UPDATE password_reset_tokens SET used_at = NOW() 
     WHERE user_id = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [userId]
  );

  // Create new token
  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );
}

/**
 * Find a valid password reset token
 */
export async function findPasswordResetToken(tokenHash: string): Promise<any | null> {
  const result = await query(
    `SELECT prt.*, u.id as user_id, u.email
     FROM password_reset_tokens prt
     JOIN users u ON prt.user_id = u.id
     WHERE prt.token_hash = $1 
       AND prt.used_at IS NULL 
       AND prt.expires_at > NOW()`,
    [tokenHash]
  );
  return result.rows[0] || null;
}

/**
 * Mark password reset token as used
 */
export async function markPasswordResetTokenUsed(tokenHash: string): Promise<void> {
  await query(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1',
    [tokenHash]
  );
}

// ============================================
// EMAIL VERIFICATION TOKENS
// ============================================

/**
 * Create an email verification token
 */
export async function createEmailVerificationToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<void> {
  // Invalidate any existing tokens for this user
  await query(
    `UPDATE email_verification_tokens SET verified_at = NOW() 
     WHERE user_id = $1 AND verified_at IS NULL AND expires_at > NOW()`,
    [userId]
  );

  // Create new token
  await query(
    `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );
}

/**
 * Find a valid email verification token
 */
export async function findEmailVerificationToken(tokenHash: string): Promise<any | null> {
  const result = await query(
    `SELECT evt.*, u.id as user_id, u.email
     FROM email_verification_tokens evt
     JOIN users u ON evt.user_id = u.id
     WHERE evt.token_hash = $1 
       AND evt.verified_at IS NULL 
       AND evt.expires_at > NOW()`,
    [tokenHash]
  );
  return result.rows[0] || null;
}

/**
 * Mark email verification token as verified
 */
export async function markEmailVerificationTokenVerified(tokenHash: string): Promise<void> {
  await query(
    'UPDATE email_verification_tokens SET verified_at = NOW() WHERE token_hash = $1',
    [tokenHash]
  );
}
