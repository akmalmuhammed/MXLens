/**
 * Unit tests for email verification server actions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing
vi.mock('@/lib/tokens', () => ({
    generateVerificationToken: vi.fn().mockResolvedValue({ token: 'mock-token', email: 'test@example.com' }),
    getVerificationTokenByToken: vi.fn(),
    deleteVerificationToken: vi.fn()
}));

vi.mock('@/lib/email', () => ({
    sendVerificationEmail: vi.fn().mockResolvedValue({ success: true })
}));

import { db } from '@/lib/db';
import { getVerificationTokenByToken, deleteVerificationToken } from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/email';

describe('Email Verification Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('verifyEmail', () => {
        it('should return error for invalid token', async () => {
            const { verifyEmail } = await import('@/actions/email-verification');

            vi.mocked(getVerificationTokenByToken).mockResolvedValue(null);

            const result = await verifyEmail('invalid-token');

            expect(result.error).toBeDefined();
        });

        it('should return error for expired token', async () => {
            const { verifyEmail } = await import('@/actions/email-verification');

            vi.mocked(getVerificationTokenByToken).mockResolvedValue({
                id: '1',
                email: 'user@example.com',
                token: 'expired-token',
                expires: new Date(Date.now() - 1000), // Expired
                type: 'EMAIL_VERIFICATION',
                createdAt: new Date()
            });

            const result = await verifyEmail('expired-token');

            expect(result.error).toContain('expired');
        });

        it('should verify email on valid token', async () => {
            const { verifyEmail } = await import('@/actions/email-verification');

            vi.mocked(getVerificationTokenByToken).mockResolvedValue({
                id: '1',
                email: 'user@example.com',
                token: 'valid-token',
                expires: new Date(Date.now() + 86400000),
                type: 'EMAIL_VERIFICATION',
                createdAt: new Date()
            });

            vi.mocked(db.user.findUnique).mockResolvedValue({
                id: '1',
                email: 'user@example.com',
                name: 'Test',
                hashedPassword: 'hash',
                emailVerified: null,
                image: null,
                mfaEnabled: false,
                isPlatformAdmin: false,
                adminRole: null,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            vi.mocked(db.user.update).mockResolvedValue({
                id: '1',
                email: 'user@example.com',
                name: 'Test',
                hashedPassword: 'hash',
                emailVerified: new Date(),
                image: null,
                mfaEnabled: false,
                isPlatformAdmin: false,
                adminRole: null,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const result = await verifyEmail('valid-token');

            expect(result.success).toBe(true);
            expect(db.user.update).toHaveBeenCalled();
            expect(deleteVerificationToken).toHaveBeenCalled();
        });
    });

    describe('resendVerificationEmail', () => {
        it('should send verification email to existing unverified user', async () => {
            const { resendVerificationEmail } = await import('@/actions/email-verification');

            vi.mocked(db.user.findUnique).mockResolvedValue({
                id: '1',
                email: 'user@example.com',
                name: 'Test User',
                hashedPassword: 'hash',
                emailVerified: null, // Not verified
                image: null,
                mfaEnabled: false,
                isPlatformAdmin: false,
                adminRole: null,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const result = await resendVerificationEmail('user@example.com');

            expect(result.success).toBe(true);
            expect(sendVerificationEmail).toHaveBeenCalled();
        });

        it('should return error if user not found', async () => {
            const { resendVerificationEmail } = await import('@/actions/email-verification');

            vi.mocked(db.user.findUnique).mockResolvedValue(null);

            const result = await resendVerificationEmail('nonexistent@example.com');

            expect(result.error).toBeDefined();
        });

        it('should return error if user already verified', async () => {
            const { resendVerificationEmail } = await import('@/actions/email-verification');

            vi.mocked(db.user.findUnique).mockResolvedValue({
                id: '1',
                email: 'user@example.com',
                name: 'Test',
                hashedPassword: 'hash',
                emailVerified: new Date(), // Already verified
                image: null,
                mfaEnabled: false,
                isPlatformAdmin: false,
                adminRole: null,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const result = await resendVerificationEmail('user@example.com');

            expect(result.error).toContain('already verified');
        });
    });
});
