import Redis from 'ioredis';
import { logger } from './logger';

let redisClient: Redis | null = null;

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        // Retry every 3s in dev, max 5 attempts
        if (times > 5) return null;
        return 3000;
      },
    });

    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('error', (err) => logger.warn({ err: err.message }, 'Redis connection pending/offline'));
    redisClient.on('ready', () => logger.info('Redis ready'));
  }
  return redisClient;
}

export function getRedisForBullMQ(): Redis {
  return new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}
