/**
 * Logger configuration using Pino
 */
import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

// Create Pino logger instance
export const logger = pino({
  level: logLevel,
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    pid: process.pid,
    env: process.env.NODE_ENV,
  },
  // Redact sensitive fields
  redact: {
    paths: [
      'password',
      'password_hash',
      'token',
      'refresh_token',
      'access_token',
      'authorization',
      'cookie',
      '*.password',
      '*.token',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    remove: true,
  },
});

/**
 * Create a child logger with additional context
 */
export function createChildLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * Log HTTP requests
 */
export function logRequest(
  req: any,
  res: any,
  responseTime: number
): void {
  logger.info(
    {
      req: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        remoteAddress: req.ip,
      },
      res: {
        statusCode: res.statusCode,
      },
      responseTime,
    },
    `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`
  );
}
