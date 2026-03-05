// lib/rate-limit.ts – Redis-based rate limiter for LLM endpoints
import { redis } from "./redis";

interface RateLimitOptions {
  key: string; // e.g. `rl:lyrics:userId`
  limit: number;
  windowSec: number; // window in seconds
}

export async function checkRateLimit(opts: RateLimitOptions): Promise<{
  allowed: boolean;
  remaining: number;
}> {
  if (!redis) return { allowed: true, remaining: opts.limit };

  const now = Math.floor(Date.now() / 1000);
  const windowKey = `${opts.key}:${Math.floor(now / opts.windowSec)}`;

  const results = await redis
    .multi()
    .incr(windowKey)
    .expire(windowKey, opts.windowSec)
    .exec();

  const count = (results?.[0]?.[1] as number) ?? 1;
  const allowed = count <= opts.limit;
  const remaining = Math.max(0, opts.limit - count);

  return { allowed, remaining };
}
