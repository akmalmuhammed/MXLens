
import { db } from "@/lib/db";
import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import type { AdminRole } from "@prisma/client";

// Constants
const ADMIN_COOKIE_NAME = "admin_token";
const SESSION_DURATION_HOURS = 12;

// Secret for JWT (use env or fallback for fail-safe)
const JWT_SECRET = new TextEncoder().encode(
    process.env.ADMIN_AUTH_SECRET || process.env.BETTER_AUTH_SECRET || "fallback-admin-secret-do-not-use-in-prod"
);

export type AdminSessionData = {
    userId: string;
    email: string;
    name: string | null;
    role: string;
};

/**
 * Hash a password for storage
 */
export async function hashPassword(password: string): Promise<string> {
    return await hash(password, 12);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return await compare(password, hash);
}

/**
 * Create a new admin session (DB + Cookie)
 */
export async function createAdminSession(userId: string, userAgent?: string, ip?: string) {
    // 1. Generate unique token (using JWT for stateless verification capability option, but we'll use DB for security)
    const token = await new SignJWT({ sub: userId })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_DURATION_HOURS}h`)
        .sign(JWT_SECRET);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

    // 2. Store in DB (for revocation support)
    await db.adminSession.create({
        data: {
            token,
            userId,
            expiresAt,
            userAgent,
            ipAddress: ip,
            createdAt: new Date(),
        },
    });

    // 3. Set Cookie
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        // Important: Set domain to allow subdomains if needed, but for isolated admin.mxlens.com, 
        // omitting domain usually mimics host-only which is fine, OR set to .mxlens.com if sharing.
        // User requested separation, so let's stick to default (host-only) or explicit admin domain.
        // However, middleware runs on Edge, simpler to keep it host-only for now unless cross-talk needed.
        expires: expiresAt,
    });

    return token;
}

/**
 * Verify current session from cookies
 */
export async function verifyAdminSession(): Promise<AdminSessionData | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

    if (!token) return null;

    try {
        // 1. Verify JWT signature first (fast)
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userId = payload.sub as string;

        // 2. Verify Session in DB (secure)
        const session = await db.adminSession.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!session || session.expiresAt < new Date()) {
            return null;
        }

        return {
            userId: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: session.user.role || "SUPER_ADMIN",
        };
    } catch (e) {
        console.error("Error verifying admin session:", e);
        return null; // Invalid token
    }
}

/**
 * Destroy session (Logout)
 */
export async function destroyAdminSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

    if (token) {
        // Remove from DB
        try {
            await db.adminSession.delete({
                where: { token },
            });
        } catch (e) {
            // Ignore if already gone
        }
    }

    // Kill cookie
    cookieStore.delete(ADMIN_COOKIE_NAME);
}

/**
 * Require Admin (for Pages)
 */
export async function requireAdmin() {
    const session = await verifyAdminSession();
    if (!session) {
        redirect("/admin/auth/signin");
    }
    return session;
}

/**
 * Require Admin (for API Routes) - Throws Error instead of Redirecting
 */
export async function requireAdminApi(options: { roles?: AdminRole[] } = {}) {
    const session = await verifyAdminSession();
    if (!session) {
        throw new Error("Unauthorized");
    }
    if (options.roles && !options.roles.includes(session.role as AdminRole)) {
        throw new Error("Unauthorized");
    }
    return session;
}
