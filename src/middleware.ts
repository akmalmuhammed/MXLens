import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Helper to check for Better Auth admin session cookie
function hasAdminSession(request: NextRequest): boolean {
    // Better Auth uses "__Secure-admin.session_token" for HTTPS cookies
    const sessionCookie = request.cookies.get("__Secure-admin.session_token");
    return !!sessionCookie?.value;
}

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
