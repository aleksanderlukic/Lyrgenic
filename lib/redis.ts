// lib/redis.ts – Redis singleton (ioredis)
import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

function createRedis() {
  if (!process.env.REDIS_URL) {
    console.warn("[Redis] REDIS_URL not set – rate limiting will be skipped");
    return null;
  }
  return new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  });
}

export const redis: Redis | null = globalForRedis.redis ?? createRedis();

if (process.env.NODE_ENV !== "production")
  globalForRedis.redis = redis ?? undefined;
