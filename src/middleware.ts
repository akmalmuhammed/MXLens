import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const { nextUrl } = req;
    const hostname = req.headers.get("host") ?? "";
    // const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
    // const hostname = host.split(":")[0];

    const isLoggedIn = !!req.auth?.user;
    const isDashboard = nextUrl.pathname.startsWith("/dashboard");
    const isOnboarding = nextUrl.pathname.startsWith("/onboarding");
    const isAuthPage = nextUrl.pathname.startsWith("/auth"); // Main site auth

    // Check if we are on the admin subdomain
    const isAdminSubdomain = hostname === "admin.mxlens.com" || hostname === "admin.localhost";

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
            // Redirect to INTERNAL admin login - use absolute URL to avoid domain mismatch
            return NextResponse.redirect("https://admin.mxlens.com/admin/auth/signin");
        }

        // 2. Enforce Admin Role
        // Defensive boolean cast to handle undefined/null edge cases
        const isPlatformAdmin = Boolean(req.auth?.user?.isPlatformAdmin);
        if (!isPlatformAdmin) {
            // Redirect non-admins back to main dashboard (cross-domain)
            // Use Clean Absolute URL string to avoid context bleeding
            return NextResponse.redirect("https://mxlens.com/dashboard");
        }

        // 3. Rewrite Logic

        // Rewrite root "/" to "/admin" (The Admin Dashboard default page)
        if (nextUrl.pathname === "/") {
            return NextResponse.rewrite("https://admin.mxlens.com/admin");
        }

        // Ensure all other paths point to /admin/... (e.g. /users -> /admin/users)
        // BUT exclude paths that already start with /admin (like /admin/auth/signin)
        if (!nextUrl.pathname.startsWith("/admin")) {
            return NextResponse.rewrite(`https://admin.mxlens.com/admin${nextUrl.pathname}`);
        }

        return NextResponse.next();
    }

    // -------------------------------------------------------------------------
    // MAIN DOMAIN LOGIC
    // -------------------------------------------------------------------------

    // Block /admin routes on main domain (force subdomain usage)
    // Anti-Loop Check: Only redirect if we are NOT already on the admin subdomain
    if (nextUrl.pathname.startsWith("/admin") && !isAdminSubdomain) {
        // Use Clean Absolute URL string
        return NextResponse.redirect(`https://admin.mxlens.com${nextUrl.pathname.replace('/admin', '')}`);
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
    // Optimized matcher to exclude public assets and search engine files
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
