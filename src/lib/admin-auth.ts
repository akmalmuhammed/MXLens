import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db as prisma } from "@/lib/db";

export const adminAuth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    baseURL: process.env.BETTER_AUTH_URL || "https://admin.mxlens.com",
    basePath: "/api/admin/auth",
    secret: process.env.BETTER_AUTH_SECRET,
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 24, // 1 day
        },
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    advanced: {
        cookiePrefix: "admin",
        generateId: () => crypto.randomUUID(),
    },
});

export type AdminSession = typeof adminAuth.$Infer.Session;
