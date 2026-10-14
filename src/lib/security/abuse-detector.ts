import { redis } from "@/lib/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { headers } from "next/headers";

// Limits
const SCANS_PER_HOUR_FREE = 20;
const SCANS_PER_HOUR_PRO = 100;
const GLOBAL_BLOCKLIST_KEY = "security:blocklist:ips";

/**
 * Identify the requestor (IP or User ID)
 */
async function getIdentifier(userId?: string): Promise<string> {
    if (userId) return `user:${userId}`;

    // Fallback to IP
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0] : "unknown";
    return `ip:${ip}`;
}

/**
 * Check if the request should be blocked.
 * Enforces:
 * 1. Global IP Blocklist
 * 2. Velocity Limit (Scans per hour)
 */
export async function checkAbuse(userId?: string) {
    const identifier = await getIdentifier(userId);
    const ip = identifier.startsWith("ip:") ? identifier.split(":")[1] : null;

    // 1. Check Global Blocklist
    if (ip) {
        const isBlocked = await redis.sismember(GLOBAL_BLOCKLIST_KEY, ip);
        if (isBlocked) {
            throw new Error("Access Denied: Your IP has been flagged for abuse.");
        }
    }

    // 2. Velocity Check (Rate Limit)
    // We use a sliding window of 1 hour
    const limit = userId ? SCANS_PER_HOUR_PRO : SCANS_PER_HOUR_FREE;

    const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, "1 h"),
        analytics: true,
        prefix: "ratelimit:analysis",
    });

    const { success, limit: max, remaining, reset } = await ratelimit.limit(identifier);

    if (!success) {
        // Auto-flag if exceeding limit by 2x? 
        // For now just block.
        // If undefined/anonymous user hits limit, maybe temp ban IP?

        throw new Error(`Rate limit exceeded. You have ${remaining} scans remaining. Resets in ${Math.ceil((reset - Date.now()) / 60000)} minutes.`);
    }

    return { success, remaining };
}

/**
 * Manually block an IP (Admin Action helper)
 */
export async function blockIp(ip: string) {
    await redis.sadd(GLOBAL_BLOCKLIST_KEY, ip);
}

/**
 * Unblock an IP
 */
export async function unblockIp(ip: string) {
    await redis.srem(GLOBAL_BLOCKLIST_KEY, ip);
}
