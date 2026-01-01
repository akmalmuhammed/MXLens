/**
 * Unit tests for token generation and management
 * Tests verification and password reset token utilities  
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { db } from '@/lib/db';

describe('Token Utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('generateVerificationToken', () => {
        it('should generate a valid token', async () => {
            const { generateVerificationToken } = await import('@/lib/tokens');

            vi.mocked(db.verificationToken.deleteMany).mockResolvedValue({ count: 0 });
            vi.mocked(db.verificationToken.create).mockResolvedValue({
                id: '1',
                email: 'test@example.com',
                token: 'mock-uuid-token',
                expires: new Date(Date.now() + 86400000),
                type: 'EMAIL_VERIFICATION',
                createdAt: new Date()
            });

            const result = await generateVerificationToken('test@example.com');

            expect(result).toBeDefined();
            expect(result.email).toBe('test@example.com');
            expect(db.verificationToken.deleteMany).toHaveBeenCalled();
            expect(db.verificationToken.create).toHaveBeenCalled();
        });
    });

    describe('generatePasswordResetToken', () => {
        it('should create password reset token with correct type', async () => {
            const { generatePasswordResetToken } = await import('@/lib/tokens');

            vi.mocked(db.verificationToken.deleteMany).mockResolvedValue({ count: 0 });
            vi.mocked(db.verificationToken.create).mockResolvedValue({
                id: '1',
                email: 'user@example.com',
                token: 'reset-token',
                expires: new Date(Date.now() + 3600000),
                type: 'PASSWORD_RESET',
                createdAt: new Date()
            });

            const result = await generatePasswordResetToken('user@example.com');

            expect(result.type).toBe('PASSWORD_RESET');
        });
    });

    describe('getVerificationTokenByToken', () => {
        it('should return token if found', async () => {
            const { getVerificationTokenByToken } = await import('@/lib/tokens');

            const futureDate = new Date(Date.now() + 86400000);
            vi.mocked(db.verificationToken.findUnique).mockResolvedValue({
                id: '1',
                email: 'test@example.com',
                token: 'valid-token',
                expires: futureDate,
                type: 'EMAIL_VERIFICATION',
                createdAt: new Date()
            });

            const result = await getVerificationTokenByToken('valid-token');

            expect(result).toBeDefined();
            expect(result?.token).toBe('valid-token');
        });

        it('should return null if token not found', async () => {
            const { getVerificationTokenByToken } = await import('@/lib/tokens');

            vi.mocked(db.verificationToken.findUnique).mockResolvedValue(null);

            const result = await getVerificationTokenByToken('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('deleteVerificationToken', () => {
        it('should delete token by id', async () => {
            const { deleteVerificationToken } = await import('@/lib/tokens');

            vi.mocked(db.verificationToken.delete).mockResolvedValue({
                id: 'token-id',
                email: 'test@example.com',
                token: 'token',
                expires: new Date(),
                type: 'EMAIL_VERIFICATION',
                createdAt: new Date()
            });

            await deleteVerificationToken('token-id');

            expect(db.verificationToken.delete).toHaveBeenCalledWith({
                where: { id: 'token-id' }
            });
        });
    });
});
