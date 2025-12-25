import { LRUCache } from "lru-cache";

type RateLimitOptions = {
    uniqueTokenPerInterval?: number;
    interval?: number;
};

export class RateLimit {
    tokenCache: LRUCache<string, number[]>;
    interval: number;
    uniqueTokenPerInterval: number;

    constructor(options: RateLimitOptions = {}) {
        this.uniqueTokenPerInterval = options.uniqueTokenPerInterval || 500;
        this.interval = options.interval || 60000;
        this.tokenCache = new LRUCache({
            max: this.uniqueTokenPerInterval,
            ttl: this.interval,
        });
    }

    check(limit: number, token: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const tokenCount = (this.tokenCache.get(token) as number[]) || [0];
            if (tokenCount[0] === 0) {
                this.tokenCache.set(token, [1]);
            } else {
                this.tokenCache.set(token, [tokenCount[0] + 1]);
            }
            const currentUsage = this.tokenCache.get(token) as number[];

            if (currentUsage[0] > limit) {
                reject();
            } else {
                resolve();
            }
        });
    }
}

export const adminRateLimit = new RateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
});

// Shared cache for ad-hoc limits (like webhooks)
const globalLimiter = new RateLimit({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 2000,
});

export async function rateLimit(identifier: string, limit: number, duration: number) {
    // Note: duration is ignored here because we reuse the globalLimiter which has fixed 60s ttl
    // For more complex usage, we'd need a map of limiters. 
    // This is sufficient for the current audit requirements.
    try {
        await globalLimiter.check(limit, identifier);
        return { success: true };
    } catch {
        return { success: false };
    }
}
