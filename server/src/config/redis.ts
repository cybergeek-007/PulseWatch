/**
 * Redis configuration and client
 */
import Redis from 'ioredis';
import { logger } from './logger';

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || 'redis_secret',
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
};

// Create Redis client
const redis = new Redis(redisConfig);

// Handle Redis events
redis.on('connect', () => {
  logger.info('Redis client connected');
});

redis.on('ready', () => {
  logger.info('Redis client ready');
});

redis.on('error', (err) => {
  logger.error('Redis client error:', err);
});

redis.on('close', () => {
  logger.warn('Redis client connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Redis client reconnecting...');
});

/**
 * Cache a value with optional expiration (in seconds)
 */
export async function cacheSet(
  key: string,
  value: string,
  expireSeconds?: number
): Promise<void> {
  try {
    if (expireSeconds) {
      await redis.setex(key, expireSeconds, value);
    } else {
      await redis.set(key, value);
    }
  } catch (error) {
    logger.error({ key, error }, 'Failed to set cache');
    throw error;
  }
}

/**
 * Get a cached value
 */
export async function cacheGet(key: string): Promise<string | null> {
  try {
    return await redis.get(key);
  } catch (error) {
    logger.error({ key, error }, 'Failed to get cache');
    throw error;
  }
}

/**
 * Delete a cached value
 */
export async function cacheDelete(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    logger.error({ key, error }, 'Failed to delete cache');
    throw error;
  }
}

/**
 * Get multiple cached values
 */
export async function cacheMGet(keys: string[]): Promise<(string | null)[]> {
  try {
    return await redis.mget(keys);
  } catch (error) {
    logger.error({ keys, error }, 'Failed to get multiple cache values');
    throw error;
  }
}

/**
 * Set multiple cached values
 */
export async function cacheMSet(
  keyValues: [string, string][]
): Promise<void> {
  try {
    const pipeline = redis.pipeline();
    keyValues.forEach(([key, value]) => {
      pipeline.set(key, value);
    });
    await pipeline.exec();
  } catch (error) {
    logger.error({ keyValues, error }, 'Failed to set multiple cache values');
    throw error;
  }
}

/**
 * Check Redis health
 */
export async function checkHealth(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return false;
  }
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedis(): Promise<void> {
  logger.info('Closing Redis connection...');
  await redis.quit();
  logger.info('Redis connection closed');
}

export { redis };
