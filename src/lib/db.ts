// import { PrismaClient } from '@prisma/client'

// const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// export const db = globalForPrisma.prisma || new PrismaClient()

// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// --- MOCK DB FOR INITIAL VERCEL DEPLOY (No Database Yet) ---
export const db = {
    user: {
        count: async () => 0,
        findMany: async () => [],
        findUnique: async () => null,
        update: async () => null,
        create: async () => null,
    },
    usageLog: {
        count: async () => 0,
        findMany: async () => [],
    },
    $transaction: async (args: any[]) => args,
} as any;
