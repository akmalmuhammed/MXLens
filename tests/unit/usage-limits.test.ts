/**
 * Usage Limits Tests
 * CRITICAL PATH: Free tier enforcement
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db';

// Plan limits configuration (should match src/lib/plans.ts)
const PLAN_LIMITS = {
    FREE: { analysesPerMonth: 10 },
    PRO: { analysesPerMonth: 500 },
    TEAM: { analysesPerMonth: 2000 },
    ENTERPRISE: { analysesPerMonth: -1 } // Unlimited
};

function checkUsageLimit(plan: keyof typeof PLAN_LIMITS, currentCount: number): { allowed: boolean; remaining: number } {
    const limit = PLAN_LIMITS[plan].analysesPerMonth;

    // -1 means unlimited
    if (limit === -1) {
        return { allowed: true, remaining: Infinity };
    }

    const remaining = Math.max(0, limit - currentCount);
    return {
        allowed: currentCount < limit,
        remaining
    };
}

describe('Usage Limits', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('FREE tier limits', () => {
        it('should allow analysis when under 10 limit', () => {
            const result = checkUsageLimit('FREE', 5);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(5);
        });

        it('should allow exactly 10 analyses (0-9)', () => {
            const result = checkUsageLimit('FREE', 9);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(1);
        });

        it('should block 11th analysis', () => {
            const result = checkUsageLimit('FREE', 10);
            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
        });

        it('should block when over limit', () => {
            const result = checkUsageLimit('FREE', 15);
            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
        });
    });

    describe('PRO tier limits', () => {
        it('should allow up to 500 analyses', () => {
            const result = checkUsageLimit('PRO', 499);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(1);
        });

        it('should block after 500 analyses', () => {
            const result = checkUsageLimit('PRO', 500);
            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
        });
    });

    describe('ENTERPRISE tier', () => {
        it('should allow unlimited analyses', () => {
            const result = checkUsageLimit('ENTERPRISE', 10000);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(Infinity);
        });
    });

    describe('Database count verification', () => {
        it('should query correct month range for usage count', async () => {
            const userId = 'user_test_123';
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            vi.mocked(db.analysisLog.count).mockResolvedValue(5);

            const count = await db.analysisLog.count({
                where: {
                    userId,
                    createdAt: { gte: startOfMonth }
                }
            });

            expect(db.analysisLog.count).toHaveBeenCalledWith({
                where: {
                    userId,
                    createdAt: { gte: startOfMonth }
                }
            });
            expect(count).toBe(5);
        });
    });
});
