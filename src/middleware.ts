import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";

// Initialize Redis for Edge (Middleware)
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Validate admin session against the database via API call.
 * Edge runtime cannot directly access Prisma, so we validate via an API route.
 * 
 * SECURITY FIX: Previously only checked if cookie existed, now we verify:
 * 1. Token exists in database
 * 2. Session is not expired
 * 3. User has admin privileges
 */
async function validateAdminSession(request: NextRequest): Promise<{ valid: boolean; userId?: string }> {
    // Check for Better Auth session cookie
    const sessionCookie = request.cookies.get("__Secure-admin.session_token")
        || request.cookies.get("admin.session_token"); // Dev mode fallback

    if (!sessionCookie?.value) {
        return { valid: false };
    }

    try {
        // Validate session via internal API endpoint
        // Use request.nextUrl.origin as fallback for localhost support
        const baseUrl = process.env.BETTER_AUTH_URL || request.nextUrl.origin;

        const response = await fetch(`${baseUrl}/api/admin/auth/validate-session`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": `${sessionCookie.name}=${sessionCookie.value}`
            },
            body: JSON.stringify({ token: sessionCookie.value }),
            cache: "no-store"
        });

        if (!response.ok) {
            return { valid: false };
        }

        const data = await response.json();
        return { valid: data.valid === true, userId: data.userId };
    } catch (error) {
        console.error("[MIDDLEWARE] Admin session validation error:", error);
        // Fail closed: if we can't validate, deny access
        return { valid: false };
    }
}

export default auth(async (req) => {
    const { nextUrl } = req;
    const hostname = req.headers.get("host") ?? "";

    const isLoggedIn = !!req.auth?.user;
    const isDashboard = nextUrl.pathname.startsWith("/dashboard");
    const isOnboarding = nextUrl.pathname.startsWith("/onboarding");
    const isAuthPage = nextUrl.pathname.startsWith("/auth");

    // Check if we are on the admin subdomain (handle port for localhost)
    const isAdminSubdomain = hostname === "admin.mxlens.com" || hostname.startsWith("admin.localhost");

    // -------------------------------------------------------------------------
    // ADMIN SUBDOMAIN LOGIC (Using Better Auth with Proper Validation)
    // -------------------------------------------------------------------------
    if (isAdminSubdomain) {
        // Allow access to admin auth routes, API routes, and static assets
        if (nextUrl.pathname.startsWith("/admin/auth") ||
            nextUrl.pathname.startsWith("/api") ||
            nextUrl.pathname.startsWith("/_next")) {
            return NextResponse.next();
        }

        // SECURITY FIX: Properly validate admin session against database
        const sessionValidation = await validateAdminSession(req);

        if (!sessionValidation.valid) {
            console.log("[MIDDLEWARE] Admin session invalid or expired, redirecting to signin");
            // Determine protocol (assume https in prod, http in dev)
            const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
            return NextResponse.redirect(`${protocol}://${hostname}/admin/auth/signin`);
        }

        // User has valid admin session - allow access
        // Rewrite root "/" to "/admin"
        if (nextUrl.pathname === "/") {
            return NextResponse.rewrite(new URL("/admin", nextUrl));
        }

        // Rewrite other paths to /admin/...
        if (!nextUrl.pathname.startsWith("/admin")) {
            return NextResponse.rewrite(new URL(`/admin${nextUrl.pathname}`, nextUrl));
        }

        return NextResponse.next();
    }

    // -------------------------------------------------------------------------
    // EMERGENCY CONTROLS (Redis-based)
    // -------------------------------------------------------------------------


    // -------------------------------------------------------------------------
    // EMERGENCY CONTROLS
    // -------------------------------------------------------------------------
    if (!isAdminSubdomain && !nextUrl.pathname.startsWith("/api/webhooks")) {
        // 1. Check System Lockdown
        // 0=None, 1=NoSignup, 2=ReadOnly, 3=Maintenance
        try {
            const lockdownLevel = await redis.get<number>("system:lockdown:level") || 0;

            if (lockdownLevel >= 3) {
                return new NextResponse("System is under maintenance. Please check back later.", { status: 503 });
            }

            if (lockdownLevel >= 2 && req.method !== "GET" && req.method !== "HEAD") {
                // Read-Only Mode: Block Mutations
                return new NextResponse("Read-Only Mode Active. Modifications are temporarily disabled.", { status: 403 });
            }

            if (lockdownLevel >= 1 && nextUrl.pathname.startsWith("/auth/signup")) {
                return NextResponse.redirect(new URL("/auth/signin?error=SignupsDisabled", nextUrl));
            }
        } catch (e) {
            console.error("Redis Middleware Error", e);
            // Fail open to avoid blocking users if Redis is down
        }
    }

    // -------------------------------------------------------------------------
    // MAIN DOMAIN LOGIC
    // -------------------------------------------------------------------------
    if (nextUrl.pathname.startsWith("/admin") && !isAdminSubdomain) {
        // Exclude localhost from redirect to allow local admin development
        if (!hostname.includes("localhost") && !hostname.includes("127.0.0.1")) {
            return NextResponse.redirect(`https://admin.mxlens.com${nextUrl.pathname.replace('/admin', '')}`);
        }
    }

    if (isDashboard || isOnboarding) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL("/auth/signin", nextUrl));
        }

        // 2. Check User Blocklist
        // Only check if logged in and accessing dashboard
        if (req.auth?.user?.id) {
            const isBlocked = await redis.get(`security:blocklist:users:${req.auth.user.id}`);
            if (isBlocked) {
                // Force Logout / Block Access
                // We can't easily sign them out here without nuking cookies, 
                // but we can block the request.
                return new NextResponse("Your account has been suspended. Please contact support.", { status: 403 });
            }
        }

        // Handle welcome redirect for new users
        if (nextUrl.searchParams.get("welcome") === "true") {
            return NextResponse.redirect(new URL("/onboarding/welcome", nextUrl));
        }
        // Default redirect for logged-in users accessing dashboard/onboarding
        // FIX: Removed unconditional redirect to /dashboard which caused infinite loop
        // If we are here, the user is authenticated and safe to proceed.
        // We only redirect if specifically on a path that NEEDS redirecting (like a completed onboarding flow),
        // otherwise, fall through to NextResponse.next()
    }

    if (isLoggedIn && isAuthPage) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
