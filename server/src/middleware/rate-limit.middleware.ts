/**
 * Rate limiting middleware
 */
import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { ERROR_CODES } from '@pulsewatch/shared';

/**
 * General API rate limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests, please try again later',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.userId || req.ip || 'unknown';
  },
});

/**
 * Stricter rate limiter for authentication endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: 'Too many authentication attempts, please try again later',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  },
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
});

/**
 * Rate limiter for monitor creation (to prevent abuse)
 */
export const monitorCreateRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 monitors per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: 'Monitor creation limit reached, please try again later',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  },
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || 'unknown';
  },
});
