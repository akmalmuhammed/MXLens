/**
 * Unit tests for password reset server actions
 * Uses FormData to match the actual action signatures
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing
vi.mock('@/lib/tokens', () => ({
    generatePasswordResetToken: vi.fn().mockResolvedValue({ token: 'mock-token', identifier: 'test@example.com' }),
    getVerificationTokenByToken: vi.fn(),
    deleteVerificationToken: vi.fn()
}));

vi.mock('@/lib/email', () => ({
    sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock('bcryptjs', () => ({
    default: {
        hash: vi.fn().mockResolvedValue('hashed-password')
    }
}));

import { db } from '@/lib/db';
import { getVerificationTokenByToken, deleteVerificationToken } from '@/lib/tokens';

// Helper to create FormData
function createFormData(data: Record<string, string>): FormData {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.append(key, value));
    return formData;
}

describe('Password Reset Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('requestPasswordReset', () => {
        it('should return success even if user not found (prevents enumeration)', async () => {
            const { requestPasswordReset } = await import('@/actions/password-reset');

            vi.mocked(db.user.findUnique).mockResolvedValue(null);

            const formData = createFormData({ email: 'nonexistent@example.com' });
            const result = await requestPasswordReset(formData);

            // Should not reveal if email exists
            expect(result.success).toBe(true);
        });

        it('should return error for invalid email format', async () => {
            const { requestPasswordReset } = await import('@/actions/password-reset');

            const formData = createFormData({ email: 'invalid-email' });
            const result = await requestPasswordReset(formData);

            expect(result.error).toBeDefined();
        });

        it('should send reset email when user exists', async () => {
            const { requestPasswordReset } = await import('@/actions/password-reset');
            const { sendPasswordResetEmail } = await import('@/lib/email');

            vi.mocked(db.user.findUnique).mockResolvedValue({
                id: '1',
                email: 'user@example.com',
                name: 'Test User',
                hashedPassword: 'hash',
                emailVerified: new Date(),
                image: null,
                mfaEnabled: false,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const formData = createFormData({ email: 'user@example.com' });
            const result = await requestPasswordReset(formData);

            expect(result.success).toBe(true);
            expect(sendPasswordResetEmail).toHaveBeenCalled();
        });
    });

    describe('resetPassword', () => {
        it('should reject invalid token', async () => {
            const { resetPassword } = await import('@/actions/password-reset');

            vi.mocked(getVerificationTokenByToken).mockResolvedValue(null);

            const formData = createFormData({ token: 'invalid-token', password: 'newpassword123' });
            const result = await resetPassword(formData);

            expect(result.error).toBeDefined();
            expect(result.error).toContain('invalid');
        });

        it('should reject expired token', async () => {
            const { resetPassword } = await import('@/actions/password-reset');

            vi.mocked(getVerificationTokenByToken).mockResolvedValue({
                id: '1',
                email: 'user@example.com',
                token: 'expired-token',
                expires: new Date(Date.now() - 1000), // Expired
                type: 'PASSWORD_RESET'
            });

            const formData = createFormData({ token: 'expired-token', password: 'newpassword123' });
            const result = await resetPassword(formData);

            expect(result.error).toContain('expired');
            expect(deleteVerificationToken).toHaveBeenCalled();
        });

        it('should update password on valid token', async () => {
            const { resetPassword } = await import('@/actions/password-reset');

            vi.mocked(getVerificationTokenByToken).mockResolvedValue({
                id: '1',
                email: 'user@example.com',
                token: 'valid-token',
                expires: new Date(Date.now() + 3600000),
                type: 'PASSWORD_RESET'
            });

            vi.mocked(db.user.findUnique).mockResolvedValue({
                id: '1',
                email: 'user@example.com',
                name: 'Test',
                hashedPassword: 'old-hash',
                emailVerified: new Date(),
                image: null,
                mfaEnabled: false,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            vi.mocked(db.user.update).mockResolvedValue({
                id: '1',
                email: 'user@example.com',
                name: 'Test',
                hashedPassword: 'new-hash',
                emailVerified: new Date(),
                image: null,
                mfaEnabled: false,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const formData = createFormData({ token: 'valid-token', password: 'newpassword123' });
            const result = await resetPassword(formData);

            expect(result.success).toBe(true);
            expect(db.user.update).toHaveBeenCalled();
            expect(deleteVerificationToken).toHaveBeenCalled();
        });

        it('should enforce minimum password length', async () => {
            const { resetPassword } = await import('@/actions/password-reset');

            const formData = createFormData({ token: 'token', password: 'short' });
            const result = await resetPassword(formData);

            expect(result.error).toBeDefined();
        });
    });
});
