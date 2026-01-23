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
    if (isAdminSubdomain) {
        // 1. Allow public admin assets/api
        if (nextUrl.pathname.startsWith("/api") ||
            nextUrl.pathname.startsWith("/_next") ||
            nextUrl.pathname.startsWith("/static")) {
            return NextResponse.next();
        }

        // 2. Auth Check
        if (!isLoggedIn) {
            // Redirect to main site login
            // We use the main domain for login to share the cookie
            // Construct main domain URL
            const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
            const mainDomain = process.env.NODE_ENV === "production" ? "mxlens.com" : "localhost:3000";

            // Redirect to main login with callback back to admin
            const loginUrl = new URL(`${protocol}://${mainDomain}/auth/signin`);
            loginUrl.searchParams.set("callbackUrl", req.url);

            return NextResponse.redirect(loginUrl);
        }

        // 3. Permission Check
        if (!user?.isPlatformAdmin) {
            // Logged in but NOT an admin
            console.log("[MIDDLEWARE] Access Denied: User is not a Platform Admin", user.email);
            return new NextResponse("Access Denied: You do not have permission to access the Admin Panel.", { status: 403 });
        }

        // 4. Permitted - Access Granted
        // Rewrite root "/" to "/admin" for convenience
        if (nextUrl.pathname === "/") {
            return NextResponse.rewrite(new URL("/admin", nextUrl));
        }

        // Rewrite all other paths to be under /admin internal route
        // e.g. admin.mxlens.com/users -> mxlens.com/admin/users
        if (!nextUrl.pathname.startsWith("/admin")) {
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
