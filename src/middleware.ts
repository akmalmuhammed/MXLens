import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const { nextUrl } = req;
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
    const hostname = host.split(":")[0]; // Handle localhost:3000 case implicitly

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
        // This page is at src/app/admin/auth/signin/page.tsx -> /admin/auth/signin
        if (nextUrl.pathname === "/admin/auth/signin") {
            return NextResponse.next();
        }

        // 1. Enforce Login
        if (!isLoggedIn) {
            // Redirect to INTERNAL admin login, not main site
            return NextResponse.redirect(new URL("/admin/auth/signin", nextUrl));
        }

        // 2. Enforce Admin Role
        const isPlatformAdmin = req.auth?.user?.isPlatformAdmin;
        if (!isPlatformAdmin) {
            // Redirect non-admins back to main dashboard (cross-domain)
            return NextResponse.redirect(new URL("https://mxlens.com/dashboard", nextUrl));
        }

        // 3. Rewrite Logic

        // Rewrite root "/" to "/admin" (The Admin Dashboard default page)
        if (nextUrl.pathname === "/") {
            return NextResponse.rewrite(new URL("/admin", nextUrl));
        }

        // Ensure all other paths point to /admin/... (e.g. /users -> /admin/users)
        // BUT exclude paths that already start with /admin (like /admin/auth/signin)
        if (!nextUrl.pathname.startsWith("/admin")) {
            return NextResponse.rewrite(new URL(`/admin${nextUrl.pathname}`, nextUrl));
        }

        return NextResponse.next();
    }

    // -------------------------------------------------------------------------
    // MAIN DOMAIN LOGIC
    // -------------------------------------------------------------------------

    // Block /admin routes on main domain (force subdomain usage)
    if (nextUrl.pathname.startsWith("/admin")) {
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
        // Removed redirect loop risk by NOT forcing redirect if they just landed on signin
        // But for UX, let's keep it, assuming main domain auth is stable.
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
