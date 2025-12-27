import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth?.user;
    const isAdminRoute = nextUrl.pathname.startsWith("/admin");
    const isDashboard = nextUrl.pathname.startsWith("/dashboard");
    const isOnboarding = nextUrl.pathname.startsWith("/onboarding");
    const isAuthPage = nextUrl.pathname.startsWith("/auth");

    // Handle admin routes
    if (isAdminRoute) {
        // Must be logged in
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL("/auth/signin", nextUrl));
        }

        // Must be a platform admin
        const isPlatformAdmin = req.auth?.user?.isPlatformAdmin;
        if (!isPlatformAdmin) {
            // Redirect non-admins to dashboard
            return NextResponse.redirect(new URL("/dashboard", nextUrl));
        }

        return NextResponse.next();
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
