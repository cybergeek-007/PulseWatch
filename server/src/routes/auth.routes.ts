/**
 * Authentication routes
 */
import { Router } from 'express';
import { AuthController } from '../controllers';
import {
  authenticate,
  authRateLimiter,
  validateRequest,
  registerValidation,
  loginValidation,
  passwordResetRequestValidation,
  passwordResetConfirmValidation,
} from '../middleware';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authRateLimiter,
  validateRequest(registerValidation),
  AuthController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authRateLimiter,
  validateRequest(loginValidation),
  AuthController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', AuthController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post('/logout', AuthController.logout);

/**
 * @route   POST /api/auth/password-reset-request
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/password-reset-request',
  authRateLimiter,
  validateRequest(passwordResetRequestValidation),
  AuthController.requestPasswordReset
);

/**
 * @route   POST /api/auth/password-reset-confirm
 * @desc    Confirm password reset
 * @access  Public
 */
router.post(
  '/password-reset-confirm',
  authRateLimiter,
  validateRequest(passwordResetConfirmValidation),
  AuthController.confirmPasswordReset
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email', AuthController.verifyEmail);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, AuthController.getCurrentUser);

export default router;
