import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const { nextUrl } = req;
    const hostname = req.headers.get("host") ?? "";

    const isLoggedIn = !!req.auth?.user;
    const isDashboard = nextUrl.pathname.startsWith("/dashboard");
    const isOnboarding = nextUrl.pathname.startsWith("/onboarding");
    const isAuthPage = nextUrl.pathname.startsWith("/auth");

    // Check if we are on the admin subdomain
    const isAdminSubdomain = hostname === "admin.mxlens.com" || hostname === "admin.localhost";

    // -------------------------------------------------------------------------
    // DEBUG: Return auth state for /api/debug/middleware
    // -------------------------------------------------------------------------
    if (nextUrl.pathname === "/api/debug/middleware") {
        return NextResponse.json({
            hostname,
            isAdminSubdomain,
            isLoggedIn,
            auth: req.auth,
            user: req.auth?.user,
            isPlatformAdmin: req.auth?.user?.isPlatformAdmin,
        });
    }

    // -------------------------------------------------------------------------
    // ADMIN SUBDOMAIN LOGIC
    // -------------------------------------------------------------------------
    if (isAdminSubdomain) {
        // Allow access to the Dedicated Admin Login Page
        if (nextUrl.pathname === "/admin/auth/signin") {
            return NextResponse.next();
        }

        // 1. Enforce Login
        if (!isLoggedIn) {
            return NextResponse.redirect("https://admin.mxlens.com/admin/auth/signin");
        }

        // 2. Enforce Admin Role
        const isPlatformAdmin = Boolean(req.auth?.user?.isPlatformAdmin);
        if (!isPlatformAdmin) {
            return NextResponse.redirect("https://mxlens.com/dashboard");
        }

        // 3. Rewrite Logic
        if (nextUrl.pathname === "/") {
            return NextResponse.rewrite("https://admin.mxlens.com/admin");
        }

        if (!nextUrl.pathname.startsWith("/admin")) {
            return NextResponse.rewrite(`https://admin.mxlens.com/admin${nextUrl.pathname}`);
        }

        return NextResponse.next();
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
        return NextResponse.next();
    }

    if (isLoggedIn && isAuthPage) {
        if (nextUrl.searchParams.get("welcome") === "true") {
            return NextResponse.redirect(new URL("/onboarding/welcome", nextUrl));
        }
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
