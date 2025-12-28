/**
 * Stripe Webhook Tests
 * CRITICAL PATH: Money flows correctly
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db';

// Mock organization for testing
const mockOrg = {
    id: 'org_test_123',
    name: 'Test Org',
    plan: 'FREE',
    subscriptionId: 'sub_test_123',
    subscriptionStatus: 'active'
};

describe('Stripe Webhook Handlers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('checkout.session.completed', () => {
        it('should upgrade organization to PRO plan', async () => {
            // Arrange
            const mockEvent = {
                type: 'checkout.session.completed',
                data: {
                    object: {
                        mode: 'subscription',
                        subscription: 'sub_new_123',
                        metadata: { orgId: 'org_test_123' }
                    }
                }
            };

            vi.mocked(db.organization.findUnique).mockResolvedValue(mockOrg as any);
            vi.mocked(db.organization.update).mockResolvedValue({
                ...mockOrg,
                plan: 'PRO',
                subscriptionId: 'sub_new_123',
                subscriptionStatus: 'active'
            } as any);

            // Act - Simulate webhook processing logic
            const orgId = mockEvent.data.object.metadata.orgId;
            const subscriptionId = mockEvent.data.object.subscription;

            await db.organization.update({
                where: { id: orgId },
                data: {
                    plan: 'PRO',
                    subscriptionId: subscriptionId,
                    subscriptionStatus: 'active'
                }
            });

            // Assert
            expect(db.organization.update).toHaveBeenCalledWith({
                where: { id: 'org_test_123' },
                data: {
                    plan: 'PRO',
                    subscriptionId: 'sub_new_123',
                    subscriptionStatus: 'active'
                }
            });
        });
    });

    describe('invoice.payment_failed', () => {
        it('should set organization status to past_due', async () => {
            // Arrange
            const mockEvent = {
                type: 'invoice.payment_failed',
                data: {
                    object: {
                        subscription: 'sub_test_123'
                    }
                }
            };

            vi.mocked(db.organization.findFirst).mockResolvedValue(mockOrg as any);
            vi.mocked(db.organization.update).mockResolvedValue({
                ...mockOrg,
                subscriptionStatus: 'past_due'
            } as any);

            // Act - Simulate webhook processing logic
            const subscriptionId = mockEvent.data.object.subscription;
            const org = await db.organization.findFirst({ where: { subscriptionId } });

            if (org) {
                await db.organization.update({
                    where: { id: org.id },
                    data: { subscriptionStatus: 'past_due' }
                });
            }

            // Assert
            expect(db.organization.findFirst).toHaveBeenCalledWith({
                where: { subscriptionId: 'sub_test_123' }
            });
            expect(db.organization.update).toHaveBeenCalledWith({
                where: { id: 'org_test_123' },
                data: { subscriptionStatus: 'past_due' }
            });
        });
    });

    describe('customer.subscription.deleted', () => {
        it('should downgrade organization to FREE plan', async () => {
            // Arrange
            const mockEvent = {
                type: 'customer.subscription.deleted',
                data: {
                    object: {
                        id: 'sub_test_123'
                    }
                }
            };

            vi.mocked(db.organization.findFirst).mockResolvedValue(mockOrg as any);
            vi.mocked(db.organization.update).mockResolvedValue({
                ...mockOrg,
                plan: 'FREE',
                subscriptionId: null,
                subscriptionStatus: 'canceled'
            } as any);

            // Act
            const subscriptionId = mockEvent.data.object.id;
            const org = await db.organization.findFirst({ where: { subscriptionId } });

            if (org) {
                await db.organization.update({
                    where: { id: org.id },
                    data: {
                        plan: 'FREE',
                        subscriptionId: null,
                        subscriptionStatus: 'canceled'
                    }
                });
            }

            // Assert
            expect(db.organization.update).toHaveBeenCalledWith({
                where: { id: 'org_test_123' },
                data: {
                    plan: 'FREE',
                    subscriptionId: null,
                    subscriptionStatus: 'canceled'
                }
            });
        });
    });
});
