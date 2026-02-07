/**
 * Shared constants for PulseWatch
 */

// Monitor intervals in milliseconds
export const MONITOR_INTERVALS = {
  ONE_MINUTE: 60000,
  FIVE_MINUTES: 300000,
  FIFTEEN_MINUTES: 900000,
  THIRTY_MINUTES: 1800000,
} as const;

// Default values
export const DEFAULTS = {
  MONITOR_INTERVAL: MONITOR_INTERVALS.FIVE_MINUTES,
  MONITOR_TIMEOUT: 30000,
  MONITOR_RETRIES: 3,
  MAX_RETRIES_BEFORE_ALERT: 3,
  ALERT_THRESHOLD_MINUTES: 5,
  TIMEZONE: 'UTC',
  PAGINATION_LIMIT: 20,
  MAX_PAGINATION_LIMIT: 100,
} as const;

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error codes
export const ERROR_CODES = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

// Monitor regions
export const MONITOR_REGIONS = [
  'us-east-1',
  'us-west-2',
  'eu-west-1',
  'eu-central-1',
  'ap-southeast-1',
  'ap-northeast-1',
] as const;

// Notification channels
export const NOTIFICATION_CHANNELS = [
  'email',
  'webhook',
  'slack',
  'discord',
  'sms',
] as const;

// Incident severities
export const INCIDENT_SEVERITIES = [
  'critical',
  'high',
  'medium',
  'low',
] as const;

// Incident statuses
export const INCIDENT_STATUSES = [
  'open',
  'acknowledged',
  'resolved',
  'closed',
] as const;

// Monitor types
export const MONITOR_TYPES = [
  'http',
  'https',
  'tcp',
  'ping',
  'grpc',
] as const;

// HTTP methods
export const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'HEAD',
  'OPTIONS',
] as const;

// JWT expiration times
export const JWT_EXPIRATION = {
  ACCESS: '15m',
  REFRESH: '7d',
} as const;

// Cookie names
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

// Rate limiting
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  AUTH_MAX_REQUESTS: 5,
} as const;
