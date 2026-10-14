"use server";

import { db } from "@/lib/db";
import { headers } from "next/headers";

/**
 * Login Attempt Logger
 * 
 * Tracks login attempts for security monitoring.
 * - Successful logins are logged for audit trail
 * - Failed logins are tracked for brute-force detection
 */

interface LoginAttemptData {
    email: string;
    success: boolean;
    reason?: string; // "invalid_password", "user_not_found", "account_locked", etc.
}

export async function logLoginAttempt(data: LoginAttemptData): Promise<void> {
    try {
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "unknown";
        const userAgent = headersList.get("user-agent") || "unknown";

        // Log to console for now (in production, this would go to a dedicated logging service)
        console.log(`[AUTH] Login attempt: ${JSON.stringify({
            email: data.email,
            success: data.success,
            reason: data.reason,
            ip,
            userAgent: userAgent.slice(0, 100), // Truncate for logging
            timestamp: new Date().toISOString()
        })}`);

        // If this is a failed attempt, check for suspicious patterns
        if (!data.success) {
            await checkBruteForceAttempt(data.email, ip);
        }

    } catch (error) {
        console.error("[AUTH] Failed to log login attempt:", error);
        // Don't throw - logging failures shouldn't break login flow
    }
}

/**
 * Check for brute force patterns
 * Uses Redis to track failed attempts per IP/email
 */
async function checkBruteForceAttempt(email: string, ip: string): Promise<void> {
    // Import redis dynamically to avoid circular dependencies
    const { redis } = await import("@/lib/redis");

    const emailKey = `auth:failed:email:${email}`;
    const ipKey = `auth:failed:ip:${ip}`;

    // Increment counters with 1 hour expiry
    const [emailCount, ipCount] = await Promise.all([
        redis.incr(emailKey),
        redis.incr(ipKey)
    ]);

    // Set expiry on first increment
    if (emailCount === 1) {
        await redis.expire(emailKey, 3600); // 1 hour
    }
    if (ipCount === 1) {
        await redis.expire(ipKey, 3600); // 1 hour
    }

    // Alert thresholds
    const EMAIL_THRESHOLD = 5;  // 5 failed attempts per email per hour
    const IP_THRESHOLD = 20;    // 20 failed attempts per IP per hour

    if (emailCount >= EMAIL_THRESHOLD || ipCount >= IP_THRESHOLD) {
        // Log security alert
        console.warn(`[SECURITY] Suspicious login activity detected:`, {
            email,
            ip,
            emailFailures: emailCount,
            ipFailures: ipCount
        });

        // In production, this would trigger a Slack alert or similar
        const { alertSystemAnomaly } = await import("@/lib/slack");
        await alertSystemAnomaly({
            type: "Brute Force Attempt",
            message: `Suspicious login activity detected.\n*Email*: ${email}\n*IP*: ${ip}\n*Email failures*: ${emailCount}\n*IP failures*: ${ipCount}`,
            severity: emailCount >= EMAIL_THRESHOLD * 2 || ipCount >= IP_THRESHOLD * 2
                ? "critical"
                : "warning"
        });
    }
}

/**
 * Clear failed login attempts after successful login
 */
export async function clearLoginAttempts(email: string): Promise<void> {
    try {
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "unknown";

        const { redis } = await import("@/lib/redis");

        await Promise.all([
            redis.del(`auth:failed:email:${email}`),
            redis.del(`auth:failed:ip:${ip}`)
        ]);
    } catch (error) {
        console.error("[AUTH] Failed to clear login attempts:", error);
    }
}
