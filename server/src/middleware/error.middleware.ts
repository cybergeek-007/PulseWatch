/**
 * Error handling middleware
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { HTTP_STATUS, ERROR_CODES } from '@pulsewatch/shared';

// Custom API Error class
export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: string = ERROR_CODES.INTERNAL_ERROR,
    details?: Record<string, string[]>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, string[]>) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTH_UNAUTHORIZED);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTH_FORBIDDEN);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource already exists') {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default error values
  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let errorCode = ERROR_CODES.INTERNAL_ERROR;
  let message = 'Internal server error';
  let details: Record<string, string[]> | undefined;

  // Handle known error types
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  } else if (err.name === 'ValidationError' || err.name === 'ZodError') {
    statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    errorCode = ERROR_CODES.AUTH_UNAUTHORIZED;
    message = err.message;
  }

  // Log error
  if (statusCode >= 500) {
    logger.error(
      {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        userId: req.user?.userId,
      },
      'Server error'
    );
  } else {
    logger.warn(
      {
        error: err.message,
        url: req.url,
        method: req.method,
        statusCode,
      },
      'Client error'
    );
  }

  // Send response
  const response: any = {
    success: false,
    error: {
      code: errorCode,
      message,
    },
    meta: {
      timestamp: new Date().toISOString(),
      request_id: req.headers['x-request-id'] || undefined,
    },
  };

  if (details) {
    response.error.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.error.stack = err.stack.split('\n');
  }

  res.status(statusCode).json(response);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: {
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: `Route ${req.method} ${req.path} not found`,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
