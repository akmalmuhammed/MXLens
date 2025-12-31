import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";

// Initialize Redis for Edge (Middleware)
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Helper to check for Better Auth admin session cookie
function hasAdminSession(request: NextRequest): boolean {
    // Better Auth uses "__Secure-admin.session_token" for HTTPS cookies
    const sessionCookie = request.cookies.get("__Secure-admin.session_token");
    return !!sessionCookie?.value;
}

export default auth(async (req) => {
    const { nextUrl } = req;
    const hostname = req.headers.get("host") ?? "";

    const isLoggedIn = !!req.auth?.user;
    const isDashboard = nextUrl.pathname.startsWith("/dashboard");
    const isOnboarding = nextUrl.pathname.startsWith("/onboarding");
    const isAuthPage = nextUrl.pathname.startsWith("/auth");

    // Check if we are on the admin subdomain
    const isAdminSubdomain = hostname === "admin.mxlens.com" || hostname === "admin.localhost";

    // -------------------------------------------------------------------------
    // ADMIN SUBDOMAIN LOGIC (Using Better Auth)
    // -------------------------------------------------------------------------
    if (isAdminSubdomain) {
        // Allow access to admin auth routes, API routes, and login/logout pages
        if (nextUrl.pathname.startsWith("/admin/auth") || nextUrl.pathname.startsWith("/api")) {
            return NextResponse.next();
        }

        // Check for Better Auth admin session
        const hasSession = hasAdminSession(req);

        if (!hasSession) {
            return NextResponse.redirect("https://admin.mxlens.com/admin/auth/signin");
        }

        // User has admin session - allow access
        // Rewrite root "/" to "/admin"
        if (nextUrl.pathname === "/") {
            return NextResponse.rewrite("https://admin.mxlens.com/admin");
        }

        // Rewrite other paths to /admin/...
        if (!nextUrl.pathname.startsWith("/admin")) {
            return NextResponse.rewrite(`https://admin.mxlens.com/admin${nextUrl.pathname}`);
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
        return NextResponse.redirect(`https://admin.mxlens.com${nextUrl.pathname.replace('/admin', '')}`);
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
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    if (isLoggedIn && isAuthPage) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
