import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db as prisma } from "@/lib/db";

// Create a Proxy around Prisma to map "user" -> "adminUser" etc.
// This forces Better Auth to use our isolated admin tables
const adminPrisma = new Proxy(prisma, {
    get: (target, prop) => {
        if (prop === "user") return target.adminUser;
        if (prop === "session") return target.adminSession;
        if (prop === "account") return target.adminAccount;
        if (prop === "verification") return target.adminVerification;
        return target[prop as keyof typeof target];
    },
});

export const adminAuth = betterAuth({
    database: prismaAdapter(adminPrisma, {
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
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "user",
            },
            isPlatformAdmin: {
                type: "boolean",
                required: false,
                defaultValue: false,
            },
        },
    },
    advanced: {
        cookiePrefix: "admin",
        generateId: () => crypto.randomUUID(),
    },
});

export type AdminSession = typeof adminAuth.$Infer.Session;
