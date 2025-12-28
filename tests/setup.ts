// Global test setup
import { vi } from 'vitest';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock';

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
            update: vi.fn()
        },
        analysisLog: {
            count: vi.fn(),
            create: vi.fn()
        }
    }
}));
