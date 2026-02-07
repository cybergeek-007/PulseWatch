/**
 * Authentication controller
 */
import { Request, Response } from 'express';
import { AuthService } from '../services';
import { config } from '../config';
import { asyncHandler, ApiError, ConflictError } from '../middleware';
import type { IApiResponse, IAuthResponse, IUserProfile } from '@pulsewatch/shared';

// Cookie options
const accessTokenCookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'strict' as const,
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body);

  const response: IApiResponse<{ user: IUserProfile; message: string }> = {
    success: true,
    data: result,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  res.status(201).json(response);
});

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const ipAddress = req.ip;
  const result = await AuthService.login(req.body, ipAddress);

  // Set cookies
  res.cookie('access_token', result.access_token, accessTokenCookieOptions);
  res.cookie('refresh_token', result.refresh_token, refreshTokenCookieOptions);

  const response: IApiResponse<IAuthResponse> = {
    success: true,
    data: result,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  res.status(200).json(response);
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  // Get refresh token from body or cookie
  const refreshToken = req.body.refresh_token || req.cookies?.refresh_token;

  if (!refreshToken) {
    throw new ApiError('Refresh token required', 401, 'AUTH_TOKEN_REQUIRED');
  }

  const ipAddress = req.ip;
  const result = await AuthService.refreshToken(refreshToken, ipAddress);

  // Update cookies
  res.cookie('access_token', result.access_token, accessTokenCookieOptions);
  res.cookie('refresh_token', result.refresh_token, refreshTokenCookieOptions);

  const response: IApiResponse<typeof result> = {
    success: true,
    data: result,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  res.status(200).json(response);
});

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.body.refresh_token || req.cookies?.refresh_token;
  const ipAddress = req.ip;

  if (refreshToken) {
    await AuthService.logout(refreshToken, ipAddress);
  }

  // Clear cookies
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');

  const response: IApiResponse<{ message: string }> = {
    success: true,
    data: { message: 'Logged out successfully' },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  res.status(200).json(response);
});

/**
 * Request password reset
 * POST /api/auth/password-reset-request
 */
export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.requestPasswordReset(req.body);

  const response: IApiResponse<typeof result> = {
    success: true,
    data: result,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  res.status(200).json(response);
});

/**
 * Confirm password reset
 * POST /api/auth/password-reset-confirm
 */
export const confirmPasswordReset = asyncHandler(async (req: Request, res: Response) => {
  await AuthService.confirmPasswordReset(req.body);

  const response: IApiResponse<{ message: string }> = {
    success: true,
    data: { message: 'Password reset successful' },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  res.status(200).json(response);
});

/**
 * Verify email
 * POST /api/auth/verify-email
 */
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError('Verification token required', 400, 'VALIDATION_ERROR');
  }

  await AuthService.verifyEmail(token);

  const response: IApiResponse<{ message: string }> = {
    success: true,
    data: { message: 'Email verified successfully' },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  res.status(200).json(response);
});

/**
 * Get current user
 * GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const user = await AuthService.getCurrentUser(userId);

  if (!user) {
    throw new ApiError('User not found', 404, 'RESOURCE_NOT_FOUND');
  }

  const response: IApiResponse<IUserProfile> = {
    success: true,
    data: user,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  res.status(200).json(response);
});
