/**
 * Validation middleware using express-validator
 */
import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { ValidationError } from './error.middleware';

/**
 * Validate request and throw ValidationError if invalid
 */
export function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorDetails: Record<string, string[]> = {};

    errors.array().forEach((error) => {
      const field = error.type === 'field' ? error.path : 'general';
      if (!errorDetails[field]) {
        errorDetails[field] = [];
      }
      errorDetails[field].push(error.msg);
    });

    throw new ValidationError('Validation failed', errorDetails);
  }

  next();
}

/**
 * Combine validation chains with validate middleware
 */
export function validateRequest(validations: ValidationChain[]) {
  return [...validations, validate];
}

// ============================================
// AUTH VALIDATIONS
// ============================================

export const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters'),
  body('timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be a string'),
];

export const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('remember_me')
    .optional()
    .isBoolean()
    .withMessage('remember_me must be a boolean'),
];

export const passwordResetRequestValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
];

export const passwordResetConfirmValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('new_password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

// ============================================
// MONITOR VALIDATIONS
// ============================================

export const createMonitorValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Monitor name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('url')
    .trim()
    .notEmpty()
    .withMessage('URL is required')
    .isURL({ require_protocol: true })
    .withMessage('Valid URL with protocol is required'),
  body('type')
    .optional()
    .isIn(['http', 'https', 'tcp', 'ping', 'grpc'])
    .withMessage('Type must be one of: http, https, tcp, ping, grpc'),
  body('method')
    .optional()
    .isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'])
    .withMessage('Method must be a valid HTTP method'),
  body('headers')
    .optional()
    .isObject()
    .withMessage('Headers must be an object'),
  body('body')
    .optional()
    .isString()
    .withMessage('Body must be a string'),
  body('interval')
    .optional()
    .isIn([60000, 300000, 900000, 1800000])
    .withMessage('Interval must be one of: 60000, 300000, 900000, 1800000 (ms)'),
  body('timeout')
    .optional()
    .isInt({ min: 1000, max: 60000 })
    .withMessage('Timeout must be between 1000 and 60000 ms'),
  body('retries')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Retries must be between 0 and 10'),
  body('expected_status_code')
    .optional()
    .isInt({ min: 100, max: 599 })
    .withMessage('Expected status code must be a valid HTTP status code'),
  body('expected_response_content')
    .optional()
    .isString()
    .withMessage('Expected response content must be a string'),
  body('follow_redirects')
    .optional()
    .isBoolean()
    .withMessage('follow_redirects must be a boolean'),
  body('verify_ssl')
    .optional()
    .isBoolean()
    .withMessage('verify_ssl must be a boolean'),
  body('regions')
    .optional()
    .isArray()
    .withMessage('Regions must be an array'),
];

export const updateMonitorValidation = [
  param('id')
    .isUUID()
    .withMessage('Valid monitor ID is required'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Monitor name cannot be empty')
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('url')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('URL cannot be empty')
    .isURL({ require_protocol: true })
    .withMessage('Valid URL with protocol is required'),
  body('type')
    .optional()
    .isIn(['http', 'https', 'tcp', 'ping', 'grpc'])
    .withMessage('Type must be one of: http, https, tcp, ping, grpc'),
  body('method')
    .optional()
    .isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'])
    .withMessage('Method must be a valid HTTP method'),
  body('headers')
    .optional()
    .isObject()
    .withMessage('Headers must be an object'),
  body('body')
    .optional()
    .isString()
    .withMessage('Body must be a string'),
  body('interval')
    .optional()
    .isIn([60000, 300000, 900000, 1800000])
    .withMessage('Interval must be one of: 60000, 300000, 900000, 1800000 (ms)'),
  body('timeout')
    .optional()
    .isInt({ min: 1000, max: 60000 })
    .withMessage('Timeout must be between 1000 and 60000 ms'),
  body('retries')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Retries must be between 0 and 10'),
  body('expected_status_code')
    .optional()
    .isInt({ min: 100, max: 599 })
    .withMessage('Expected status code must be a valid HTTP status code'),
  body('status')
    .optional()
    .isIn(['up', 'down', 'paused', 'pending'])
    .withMessage('Status must be one of: up, down, paused, pending'),
];

export const monitorIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Valid monitor ID is required'),
];

export const listMonitorsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['up', 'down', 'paused', 'pending'])
    .withMessage('Status must be one of: up, down, paused, pending'),
  query('type')
    .optional()
    .isIn(['http', 'https', 'tcp', 'ping', 'grpc'])
    .withMessage('Type must be one of: http, https, tcp, ping, grpc'),
  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search must be between 1 and 100 characters'),
  query('sort_by')
    .optional()
    .isIn(['name', 'status', 'last_checked_at', 'created_at'])
    .withMessage('Sort by must be one of: name, status, last_checked_at, created_at'),
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be one of: asc, desc'),
];
