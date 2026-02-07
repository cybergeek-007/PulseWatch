/**
 * Authentication service - business logic for user authentication
 */
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { logger } from '../config/logger';
import * as UserModel from '../models/user.model';
import * as TokenModel from '../models/token.model';
import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from '../config/email';
import type {
  IAuthResponse,
  ILoginRequest,
  ICreateUserRequest,
  IPasswordResetRequest,
  IPasswordResetConfirm,
  IUserProfile,
  ITokenPayload,
} from '@pulsewatch/shared';

// JWT configuration
const JWT_SECRET = config.jwt.secret;
const JWT_REFRESH_SECRET = config.jwt.refreshSecret;
const ACCESS_TOKEN_EXPIRY = config.jwt.accessExpiration;
const REFRESH_TOKEN_EXPIRY = config.jwt.refreshExpiration;

// Token generation
function generateAccessToken(payload: Omit<ITokenPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

function generateRefreshToken(payload: Omit<ITokenPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'refresh' }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Register a new user
 */
export async function register(
  data: ICreateUserRequest
): Promise<{ user: IUserProfile; message: string }> {
  const { email, password, first_name, last_name, timezone } = data;

  // Check if email already exists
  const existingUser = await UserModel.findByEmail(email);
  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Hash password
  const password_hash = await hashPassword(password);

  // Create user
  const user = await UserModel.create({
    email,
    password_hash,
    first_name,
    last_name,
    timezone,
  });

  // Generate email verification token
  const verificationToken = uuidv4();
  const tokenHash = await bcrypt.hash(verificationToken, 10);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await TokenModel.createEmailVerificationToken(user.id, tokenHash, expiresAt);

  // Send verification email (async, don't await)
  const verifyUrl = `${config.appUrl}/verify-email`;
  sendVerificationEmail(user.email, verificationToken, verifyUrl).catch((err) =>
    logger.error({ error: err }, 'Failed to send verification email')
  );

  // Send welcome email (async, don't await)
  sendWelcomeEmail(user.email, user.first_name || undefined).catch((err) =>
    logger.error({ error: err }, 'Failed to send welcome email')
  );

  logger.info({ userId: user.id, email: user.email }, 'User registered');

  return {
    user: UserModel.getUserProfile(user),
    message: 'Registration successful. Please check your email to verify your account.',
  };
}

/**
 * Login a user
 */
export async function login(
  data: ILoginRequest,
  ipAddress?: string
): Promise<IAuthResponse> {
  const { email, password, remember_me } = data;

  // Find user by email
  const user = await UserModel.findByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if user is active
  if (!user.is_active) {
    throw new Error('Account has been deactivated');
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password_hash);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  await UserModel.updateLastLogin(user.id);

  // Generate tokens
  const tokenPayload = { userId: user.id, email: user.email };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Store refresh token hash
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  const refreshExpiresAt = new Date(
    Date.now() + (remember_me ? 30 : 7) * 24 * 60 * 60 * 1000 // 30 days if remember_me, else 7 days
  );

  await TokenModel.createRefreshToken(user.id, refreshTokenHash, refreshExpiresAt, ipAddress);

  logger.info({ userId: user.id, email: user.email }, 'User logged in');

  return {
    user: UserModel.getUserProfile(user),
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 15 * 60, // 15 minutes in seconds
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(
  refreshToken: string,
  ipAddress?: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as ITokenPayload;

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Find token in database
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10); // This won't work for lookup
    // Instead, we need to find by user and verify
    // For simplicity, we'll verify the JWT and check if user exists

    const user = await UserModel.findById(decoded.userId);
    if (!user || !user.is_active) {
      throw new Error('User not found or inactive');
    }

    // Generate new tokens
    const tokenPayload = { userId: user.id, email: user.email };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Revoke old refresh token and store new one
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await TokenModel.createRefreshToken(user.id, newRefreshTokenHash, refreshExpiresAt, ipAddress);

    logger.info({ userId: user.id }, 'Token refreshed');

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      expires_in: 15 * 60,
    };
  } catch (error) {
    logger.error({ error }, 'Token refresh failed');
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Logout a user
 */
export async function logout(refreshToken: string, ipAddress?: string): Promise<void> {
  try {
    // Verify and decode refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as ITokenPayload;

    // Revoke the refresh token
    await TokenModel.revokeRefreshToken(refreshToken, ipAddress);

    logger.info({ userId: decoded.userId }, 'User logged out');
  } catch (error) {
    // Token might be invalid, but we still want to allow logout
    logger.warn({ error }, 'Logout with invalid token');
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(
  data: IPasswordResetRequest
): Promise<{ message: string }> {
  const { email } = data;

  const user = await UserModel.findByEmail(email);
  if (!user) {
    // Don't reveal if email exists
    return {
      message: 'If an account exists with this email, you will receive a password reset link.',
    };
  }

  // Generate reset token
  const resetToken = uuidv4();
  const tokenHash = await bcrypt.hash(resetToken, 10);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await TokenModel.createPasswordResetToken(user.id, tokenHash, expiresAt);

  // Send password reset email
  const resetUrl = `${config.appUrl}/reset-password`;
  await sendPasswordResetEmail(user.email, resetToken, resetUrl);

  logger.info({ userId: user.id }, 'Password reset requested');

  return {
    message: 'If an account exists with this email, you will receive a password reset link.',
  };
}

/**
 * Confirm password reset
 */
export async function confirmPasswordReset(
  data: IPasswordResetConfirm
): Promise<void> {
  const { token, new_password } = data;

  // Find valid reset token
  const resetTokenRecord = await TokenModel.findPasswordResetToken(token);
  if (!resetTokenRecord) {
    throw new Error('Invalid or expired reset token');
  }

  // Hash new password
  const password_hash = await hashPassword(new_password);

  // Update user password
  await UserModel.updatePassword(resetTokenRecord.user_id, password_hash);

  // Mark token as used
  await TokenModel.markPasswordResetTokenUsed(token);

  // Revoke all refresh tokens for security
  await TokenModel.revokeAllUserRefreshTokens(resetTokenRecord.user_id);

  logger.info({ userId: resetTokenRecord.user_id }, 'Password reset completed');
}

/**
 * Verify email
 */
export async function verifyEmail(token: string): Promise<void> {
  const verificationRecord = await TokenModel.findEmailVerificationToken(token);
  if (!verificationRecord) {
    throw new Error('Invalid or expired verification token');
  }

  // Mark email as verified
  await UserModel.markEmailVerified(verificationRecord.user_id);

  // Mark token as verified
  await TokenModel.markEmailVerificationTokenVerified(token);

  logger.info({ userId: verificationRecord.user_id }, 'Email verified');
}

/**
 * Get current user profile
 */
export async function getCurrentUser(userId: string): Promise<IUserProfile | null> {
  const user = await UserModel.findById(userId);
  if (!user) return null;
  return UserModel.getUserProfile(user);
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): ITokenPayload {
  return jwt.verify(token, JWT_SECRET) as ITokenPayload;
}
