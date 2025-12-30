import { betterAuth, BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db as prisma } from "@/lib/db";

// Create a Proxy around Prisma to map "user" -> "adminUser" etc.
// This forces Better Auth to use our isolated admin tables
const adminPrisma = new Proxy(prisma, {
    get: (target: any, prop: string) => {
        if (prop === "user") return target.adminUser;
        if (prop === "session") return target.adminSession;
        if (prop === "account") return target.adminAccount;
        if (prop === "verification") return target.adminVerification;
        return target[prop];
    },
});

// Lazy-load the BetterAuth instance to avoid build-time failures
// when BETTER_AUTH_SECRET is not available during static generation
let adminAuthInstance: ReturnType<typeof betterAuth> | null = null;

function getAdminAuthConfig(): BetterAuthOptions {
    const secret = process.env.BETTER_AUTH_SECRET;

    // During build, the secret may not be available - provide a placeholder
    // The actual auth will fail at runtime if secret is truly missing
    const safeSecret = secret || "build-time-placeholder-do-not-use-in-production";

    if (!secret && process.env.NODE_ENV === "production") {
        console.warn("[ADMIN_AUTH] BETTER_AUTH_SECRET is missing - auth will fail at runtime");
    }

    return {
        database: prismaAdapter(adminPrisma, {
            provider: "postgresql",
        }),
        baseURL: process.env.BETTER_AUTH_URL || "https://admin.mxlens.com",
        basePath: "/api/admin/auth",
        secret: safeSecret,
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
        },
    };
}

export function getAdminAuth() {
    if (!adminAuthInstance) {
        adminAuthInstance = betterAuth(getAdminAuthConfig());
    }
    return adminAuthInstance;
}

// Export a proxy for backwards compatibility
// Access triggers lazy initialization
export const adminAuth = new Proxy({} as ReturnType<typeof betterAuth>, {
    get(_, prop) {
        return getAdminAuth()[prop as keyof ReturnType<typeof betterAuth>];
    },
});

export type AdminSession = ReturnType<typeof getAdminAuth>["$Infer"]["Session"];
