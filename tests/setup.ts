// Global test setup
import { vi } from 'vitest';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock';
process.env.ENCRYPTION_KEY = 'a'.repeat(64); // Valid 64-char hex key for tests
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.RESEND_API_KEY = 'test_resend_key';

// Mock Prisma
vi.mock('@/lib/db', () => ({
    db: {
        organization: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            create: vi.fn()
        },
        user: {
            findUnique: vi.fn(),
            update: vi.fn(),
            create: vi.fn()
        },
        analysisLog: {
            count: vi.fn(),
            create: vi.fn()
        },
        verificationToken: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
            deleteMany: vi.fn()
        }
    }
}));

