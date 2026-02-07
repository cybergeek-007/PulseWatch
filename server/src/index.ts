/**
 * PulseWatch API Server
 * Main entry point
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

import { config, validateConfig, closePool, checkHealth as checkDbHealth } from './config';
import { logger, createChildLogger } from './config/logger';
import { closeRedis, checkHealth as checkRedisHealth } from './config/redis';
import routes from './routes';
import { errorHandler, notFoundHandler, apiRateLimiter } from './middleware';

const appLogger = createChildLogger({ component: 'Server' });

// Validate configuration
validateConfig();

// Create Express app
const app = express();

// Trust proxy (for getting client IP behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: config.isProduction,
  crossOriginEmbedderPolicy: config.isProduction,
}));

// CORS configuration
app.use(cors({
  origin: config.appUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Request logging
if (config.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }));
}

// Rate limiting
app.use('/api/', apiRateLimiter);

// API routes
app.use('/api', routes);

// Health check endpoint (outside /api for load balancers)
app.get('/health', async (req, res) => {
  const [dbHealthy, redisHealthy] = await Promise.all([
    checkDbHealth(),
    checkRedisHealth(),
  ]);

  const status = dbHealthy && redisHealthy ? 200 : 503;

  res.status(status).json({
    success: status === 200,
    data: {
      status: status === 200 ? 'healthy' : 'unhealthy',
      services: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        redis: redisHealthy ? 'healthy' : 'unhealthy',
      },
      timestamp: new Date().toISOString(),
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(config.port, config.host, () => {
  appLogger.info(
    `Server running on http://${config.host}:${config.port} in ${config.env} mode`
  );
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  appLogger.info(`${signal} received. Starting graceful shutdown...`);

  // Close HTTP server
  server.close(() => {
    appLogger.info('HTTP server closed');
  });

  // Close database connections
  try {
    await closePool();
  } catch (error) {
    appLogger.error('Error closing database pool:', error);
  }

  // Close Redis connection
  try {
    await closeRedis();
  } catch (error) {
    appLogger.error('Error closing Redis connection:', error);
  }

  appLogger.info('Graceful shutdown complete');
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  appLogger.fatal('Uncaught exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  appLogger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

export default app;
