import { Redis } from "@upstash/redis";
import { Ratelimit, type Duration } from "@upstash/ratelimit";

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

type LazyRateLimiter = Pick<Ratelimit, "limit" | "getRemaining" | "resetUsedTokens">;

function createRateLimiter(
    limit: number,
    window: Duration,
    prefix: string,
    analytics = true
): Ratelimit {
    return new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(limit, window),
        prefix,
        analytics,
    });
}

function lazyRateLimiter(
    limit: number,
    window: Duration,
    prefix: string,
    analytics = true
): LazyRateLimiter {
    let limiter: Ratelimit | null = null;

    function getLimiter() {
        limiter ??= createRateLimiter(limit, window, prefix, analytics);
        return limiter;
    }

    return {
        limit: (...args) => getLimiter().limit(...args),
        getRemaining: (...args) => getLimiter().getRemaining(...args),
        resetUsedTokens: (...args) => getLimiter().resetUsedTokens(...args),
    };
}

/**
 * Admin API rate limiter: 100 requests per minute
 */
export const adminRateLimiter = lazyRateLimiter(100, "1 m", "ratelimit:admin");

/**
 * General API rate limiter: 60 requests per minute per IP
 */
export const apiRateLimiter = lazyRateLimiter(60, "1 m", "ratelimit:api");

/**
 * Analysis rate limiter: 10 requests per minute (per user/org)
 */
export const analysisRateLimiter = lazyRateLimiter(10, "1 m", "ratelimit:analysis");

/**
 * Webhook rate limiter: 30 requests per minute per IP
 */
export const webhookRateLimiter = lazyRateLimiter(30, "1 m", "ratelimit:webhook");

/**
 * Generic rate limit function for ad-hoc use
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param limit - Max requests allowed
 * @param window - Time window (e.g., "1 m", "1 h", "1 d")
 */
export async function rateLimit(
    identifier: string,
    limit: number = 60,
    window: Duration = "1 m"
): Promise<{ success: boolean; remaining: number; reset: number }> {
    const limiter = createRateLimiter(limit, window, "ratelimit:adhoc", false);

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
