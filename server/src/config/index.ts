/**
 * Central configuration exports
 */
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

// Application configuration
export const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // Server
  port: parseInt(process.env.API_PORT || '3001', 10),
  host: process.env.API_HOST || '0.0.0.0',

  // URLs
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:3001',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'pulsewatch',
    password: process.env.DB_PASSWORD || 'pulsewatch_secret',
    name: process.env.DB_NAME || 'pulsewatch',
    url: process.env.DATABASE_URL,
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || 'redis_secret',
    url: process.env.REDIS_URL,
  },

  // Email
  email: {
    smtpHost: process.env.SMTP_HOST || 'localhost',
    smtpPort: parseInt(process.env.SMTP_PORT || '1025', 10),
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpSecure: process.env.SMTP_SECURE === 'true',
    from: process.env.SMTP_FROM || 'noreply@pulsewatch.io',
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Monitoring
  monitoring: {
    defaultInterval: parseInt(process.env.MONITOR_DEFAULT_INTERVAL || '300000', 10),
    maxRetries: parseInt(process.env.MONITOR_MAX_RETRIES || '3', 10),
    timeout: parseInt(process.env.MONITOR_TIMEOUT || '30000', 10),
  },

  // Features
  features: {
    enableEmailAlerts: process.env.ENABLE_EMAIL_ALERTS === 'true',
    enableWebhookNotifications: process.env.ENABLE_WEBHOOK_NOTIFICATIONS === 'true',
    enablePublicStatusPages: process.env.ENABLE_PUBLIC_STATUS_PAGES === 'true',
  },
} as const;

// Validate required configuration
export function validateConfig(): void {
  const required = [
    'jwt.secret',
    'jwt.refreshSecret',
  ];

  const missing = required.filter((key) => {
    const value = key.split('.').reduce((obj, k) => obj?.[k], config as any);
    return !value || value.includes('change-this-in-production');
  });

  if (missing.length > 0 && config.isProduction) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
}

export * from './database';
export * from './redis';
export * from './logger';
export * from './email';
