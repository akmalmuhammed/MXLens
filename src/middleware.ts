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
    const isAdminSubdomain = hostname === "admin.mxlens.com" || hostname === "admin.localhost:3000"; // For local dev

    // -------------------------------------------------------------------------
    // ADMIN SUBDOMAIN LOGIC
    // -------------------------------------------------------------------------
    if (isAdminSubdomain) {
        // Rewrite root "/" to "/admin"
        if (nextUrl.pathname === "/") {
            const url = new URL("/admin", nextUrl);
            return NextResponse.rewrite(url);
        }

        // If path doesn't start with /admin, rewrite it to /admin/...
        // (This makes admin.mxlens.com/users -> /admin/users)
        if (!nextUrl.pathname.startsWith("/admin")) {
            const url = new URL(`/admin${nextUrl.pathname}`, nextUrl);
            return NextResponse.rewrite(url);
        }

        // At this point, the URL is technically /admin/... due to rewrite or direct access
        // We must ensure the user is an admin
        if (!isLoggedIn) {
            // Redirect to main site login if not logged in
            // We can use the main domain for auth to share cookies easier
            // Or keep them on admin subdomain if cookies are shared correctly
            return NextResponse.redirect(new URL("/auth/signin", nextUrl));
        }

        const isPlatformAdmin = req.auth?.user?.isPlatformAdmin;
        if (!isPlatformAdmin) {
            // Redirect non-admins back to main dashboard
            return NextResponse.redirect(new URL("https://mxlens.com/dashboard", nextUrl));
        }

        return NextResponse.next();
    }

    // -------------------------------------------------------------------------
    // MAIN DOMAIN ADMIN ROUTE PROTECTION
    // -------------------------------------------------------------------------
    // Block /admin on main domain (unless we want to allow it as alias)
    // If user tries mxlens.com/admin, we can redirect to admin.mxlens.com or treat as normal admin route
    const isAdminRoute = nextUrl.pathname.startsWith("/admin");
    if (isAdminRoute) {
        if (!isLoggedIn) return NextResponse.redirect(new URL("/auth/signin", nextUrl));
        const isPlatformAdmin = req.auth?.user?.isPlatformAdmin;
        if (!isPlatformAdmin) return NextResponse.redirect(new URL("/dashboard", nextUrl));
        return NextResponse.next();
    }

    // -------------------------------------------------------------------------
    // STANDARD APP PROTECTION
    // -------------------------------------------------------------------------
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
