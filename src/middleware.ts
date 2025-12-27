import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const { nextUrl } = req;
    const hostname = req.headers.get("host");

    const isLoggedIn = !!req.auth?.user;
    const isDashboard = nextUrl.pathname.startsWith("/dashboard");
    const isOnboarding = nextUrl.pathname.startsWith("/onboarding");
    const isAuthPage = nextUrl.pathname.startsWith("/auth");

    // Check if we are on the admin subdomain
    const isAdminSubdomain = hostname === "admin.mxlens.com" || hostname === "admin.localhost:3000";

    // -------------------------------------------------------------------------
    // ADMIN SUBDOMAIN LOGIC
    // -------------------------------------------------------------------------
    if (isAdminSubdomain) {
        // 1. Handle Auth: Redirect all auth/login attempts to the main domain
        // This ensures cookies are set on .mxlens.com correctly
        if (isAuthPage) {
            return NextResponse.redirect(new URL(`https://mxlens.com${nextUrl.pathname}${nextUrl.search}`, nextUrl));
        }

        // 2. Enforce Login
        if (!isLoggedIn) {
            const from = encodeURIComponent(nextUrl.pathname);
            // Redirect to main site login
            return NextResponse.redirect(new URL(`https://mxlens.com/auth/signin?callbackUrl=https://${hostname}${nextUrl.pathname}`, nextUrl));
        }

        // 3. Enforce Admin Role
        const isPlatformAdmin = req.auth?.user?.isPlatformAdmin;
        if (!isPlatformAdmin) {
            // Redirect non-admins back to main dashboard
            return NextResponse.redirect(new URL("https://mxlens.com/dashboard", nextUrl));
        }

        // 4. Rewrite Logic (The "Magic")
        // If we are here, user is logged in AND is an admin.

        // Rewrite root "/" to "/admin"
        if (nextUrl.pathname === "/") {
            return NextResponse.rewrite(new URL("/admin", nextUrl));
        }

        // If path doesn't start with /admin, rewrite it to /admin/...
        if (!nextUrl.pathname.startsWith("/admin")) {
            return NextResponse.rewrite(new URL(`/admin${nextUrl.pathname}`, nextUrl));
        }

        return NextResponse.next();
    }

    // -------------------------------------------------------------------------
    // MAIN DOMAIN LOGIC
    // -------------------------------------------------------------------------

    // Block /admin on main domain to prevent duplicate content SEO issues
    // and force usage of the subdomain
    if (nextUrl.pathname.startsWith("/admin")) {
        // Optional: Redirect to subdomain
        return NextResponse.redirect(new URL(`https://admin.mxlens.com${nextUrl.pathname.replace('/admin', '')}`, nextUrl));
    }

    // Protect dashboard and onboarding
    if (isDashboard || isOnboarding) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL("/auth/signin", nextUrl));
        }
        return NextResponse.next();
    }

    // Redirect logged-in users away from auth pages
    if (isLoggedIn && isAuthPage) {
        if (nextUrl.searchParams.get("welcome") === "true") {
            return NextResponse.redirect(new URL("/onboarding/welcome", nextUrl));
        }
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
