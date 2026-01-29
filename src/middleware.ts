import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";

// Initialize Redis for Edge (Middleware)
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default auth(async (req) => {
    const { nextUrl } = req;
    const hostname = req.headers.get("host") ?? "";

    const user = req.auth?.user;
    const isLoggedIn = !!user;

    // Path checks
    const isDashboard = nextUrl.pathname.startsWith("/dashboard");
    const isOnboarding = nextUrl.pathname.startsWith("/onboarding");
    const isAuthPage = nextUrl.pathname.startsWith("/auth");

    // Check if we are on the admin subdomain
    const isAdminSubdomain = hostname === "admin.mxlens.com" || hostname.startsWith("admin.localhost");

    console.log(`[MIDDLEWARE] ${req.method} ${nextUrl.pathname} (Host: ${hostname}) User: ${user?.email || "Guest"}`);

    // -------------------------------------------------------------------------
    // ADMIN SUBDOMAIN LOGIC (Migration to NextAuth)
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // ADMIN SUBDOMAIN LOGIC (Isolated Auth)
    // -------------------------------------------------------------------------
    if (isAdminSubdomain) {
        // 1. Allow public admin assets/api/auth
        if (nextUrl.pathname.startsWith("/api/admin/auth") ||
            nextUrl.pathname.startsWith("/admin/auth") ||
            nextUrl.pathname.startsWith("/_next") ||
            nextUrl.pathname.startsWith("/static")) {
            return NextResponse.next();
        }

        // 2. Check for Admin Token
        const adminToken = req.cookies.get("admin_token")?.value;

        if (!adminToken) {
            // For API routes, return 401 instead of redirecting
            if (nextUrl.pathname.startsWith("/api")) {
                return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
                    status: 401,
                    headers: { "Content-Type": "application/json" }
                });
            }

            // Redirect to admin login
            const protocol = nextUrl.protocol;
            const loginUrl = new URL("/admin/auth/signin", `${protocol}//${hostname}`);
            loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);

            // Avoid redirect loop: If we are already on the login page (or trying to get there), don't redirect again.
            // (Handled by Step 1, but double safety)
            if (nextUrl.pathname === "/admin/auth/signin") {
                return NextResponse.next();
            }

            return NextResponse.redirect(loginUrl);
        }

        // 3. Permitted - Access Granted

        // Rewrite root "/" to "/admin" so it hits the (dashboard) group
        if (nextUrl.pathname === "/") {
            return NextResponse.rewrite(new URL("/admin", nextUrl));
        }

        // For other paths, logic depends on folder structure.
        // If the user visits /users, and the folder is src/app/admin/(dashboard)/users,
        // Next.js routing should handle `/admin/users` if we rewrite `/users` to `/admin/users`.
        // BUT, if the user visits `/admin/users` directly, it works too.

        // Let's rely on standard rewrites but be careful not to rewrite if already prefixed.
        if (!nextUrl.pathname.startsWith("/admin") && !nextUrl.pathname.startsWith("/api")) {
            return NextResponse.rewrite(new URL(`/admin${nextUrl.pathname}`, nextUrl));
        }

        return NextResponse.next();
    }

    // -------------------------------------------------------------------------
    // EMERGENCY CONTROLS
    // -------------------------------------------------------------------------
    if (!isAdminSubdomain && !nextUrl.pathname.startsWith("/api/webhooks")) {
        try {
            const lockdownLevel = await redis.get<number>("system:lockdown:level") || 0;

            if (lockdownLevel >= 3) {
                return new NextResponse("System is under maintenance. Please check back later.", { status: 503 });
            }

            if (lockdownLevel >= 2 && req.method !== "GET" && req.method !== "HEAD") {
                return new NextResponse("Read-Only Mode Active. Modifications are temporarily disabled.", { status: 403 });
            }

            if (lockdownLevel >= 1 && nextUrl.pathname.startsWith("/auth/signup")) {
                return NextResponse.redirect(new URL("/auth/signin?error=SignupsDisabled", nextUrl));
            }
        } catch (e) {
            // Redis failure should fail open
        }
    }

    // -------------------------------------------------------------------------
    // MAIN DOMAIN LOGIC
    // -------------------------------------------------------------------------

    // Prevent direct access to /admin routes on main domain (except localhost dev)
    if (nextUrl.pathname.startsWith("/admin") && !isAdminSubdomain) {
        if (!hostname.includes("localhost") && !hostname.includes("127.0.0.1")) {
            // Redirect to admin subdomain
            return NextResponse.redirect(`https://admin.mxlens.com${nextUrl.pathname.replace('/admin', '')}`);
        }
    }

    if (isDashboard || isOnboarding) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL("/auth/signin", nextUrl));
        }

        // Check Blocklist
        if (req.auth?.user?.id) {
            const isBlocked = await redis.get(`security:blocklist:users:${req.auth.user.id}`);
            if (isBlocked) {
                return new NextResponse("Your account has been suspended.", { status: 403 });
            }
        }

        // Handle welcome
        if (nextUrl.searchParams.get("welcome") === "true") {
            return NextResponse.redirect(new URL("/onboarding/welcome", nextUrl));
        }
    }

    if (isLoggedIn && isAuthPage) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
