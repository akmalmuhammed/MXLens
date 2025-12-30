import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Initialize Redis client (lazy, serverless-safe)
let redis: Redis | null = null;

function getRedis(): Redis {
    if (!redis) {
        const url = process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;

        if (!url || !token) {
            throw new Error("Upstash Redis credentials missing. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.");
        }

        redis = new Redis({ url, token });
    }
    return redis;
}

// Pre-configured rate limiters for different use cases
// These are globally shared across all serverless instances

/**
 * Admin API rate limiter: 100 requests per minute
 */
export const adminRateLimiter = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    prefix: "ratelimit:admin",
    analytics: true,
});

/**
 * General API rate limiter: 60 requests per minute per IP
 */
export const apiRateLimiter = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    prefix: "ratelimit:api",
    analytics: true,
});

/**
 * Analysis rate limiter: 10 requests per minute (per user/org)
 */
export const analysisRateLimiter = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "ratelimit:analysis",
    analytics: true,
});

/**
 * Webhook rate limiter: 30 requests per minute per IP
 */
export const webhookRateLimiter = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix: "ratelimit:webhook",
    analytics: true,
});

/**
 * Generic rate limit function for ad-hoc use
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param limit - Max requests allowed
 * @param window - Time window (e.g., "1 m", "1 h", "1 d")
 */
export async function rateLimit(
    identifier: string,
    limit: number = 60,
    window: string = "1 m"
): Promise<{ success: boolean; remaining: number; reset: number }> {
    const limiter = new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(limit, window as any),
        prefix: "ratelimit:adhoc",
    });

    const result = await limiter.limit(identifier);

    return {
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
    };
}

// Legacy compatibility - deprecated, use specific limiters above
export class RateLimit {
    async check(limit: number, token: string): Promise<void> {
        const result = await rateLimit(token, limit, "1 m");
        if (!result.success) {
            throw new Error("Rate limit exceeded");
        }
    }
}

export const adminRateLimit = new RateLimit();
