/**
 * Authentication middleware
 */
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/auth.service';
import { logger } from '../config/logger';
import type { ITokenPayload } from '@pulsewatch/shared';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: ITokenPayload;
    }
  }
}

/**
 * Authenticate JWT token from Authorization header or cookie
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    // Get token from Authorization header or cookie
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_UNAUTHORIZED',
          message: 'Access token required',
        },
      });
      return;
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    if (decoded.type !== 'access') {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_INVALID',
          message: 'Invalid token type',
        },
      });
      return;
    }

    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_EXPIRED',
          message: 'Token has expired',
        },
      });
      return;
    }

    logger.warn({ error }, 'Authentication failed');
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_TOKEN_INVALID',
        message: 'Invalid token',
      },
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded.type === 'access') {
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
}
