import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

const isProtectedMainRoute = createRouteMatcher([
    "/dashboard(.*)",
    "/settings(.*)",
    "/team(.*)",
    "/onboarding(.*)",
    "/analysis/(.*)",
    "/insights(.*)",
    "/notifications(.*)",
    "/api/bridge/(.*)"
]);

function getRedisClient() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        return null;
    }

    redis ??= new Redis({ url, token });
    return redis;
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
    const { nextUrl } = req;
    const hostname = req.headers.get("host") ?? "";
    const isAdminSubdomain = hostname === "admin.mxlens.com" || hostname.startsWith("admin.localhost");

    if (isAdminSubdomain) {
        if (
            nextUrl.pathname.startsWith("/api/admin/auth") ||
            nextUrl.pathname.startsWith("/admin/auth") ||
            nextUrl.pathname.startsWith("/_next") ||
            nextUrl.pathname.startsWith("/__clerk") ||
            nextUrl.pathname.startsWith("/static")
        ) {
            return NextResponse.next();
        }

        const adminToken = req.cookies.get("admin_token")?.value;

        if (!adminToken) {
            if (nextUrl.pathname.startsWith("/api")) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const loginUrl = new URL("/admin/auth/signin", `${nextUrl.protocol}//${hostname}`);
            loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
            return NextResponse.redirect(loginUrl);
        }

        if (nextUrl.pathname === "/") {
            return NextResponse.rewrite(new URL("/admin", nextUrl));
        }

        if (!nextUrl.pathname.startsWith("/admin") && !nextUrl.pathname.startsWith("/api")) {
            return NextResponse.rewrite(new URL(`/admin${nextUrl.pathname}`, nextUrl));
        }

        return NextResponse.next();
    }

    if (!nextUrl.pathname.startsWith("/api/webhooks")) {
        try {
            const lockdownLevel = await getRedisClient()?.get<number>("system:lockdown:level") || 0;

            if (lockdownLevel >= 3) {
                return new NextResponse("System is under maintenance. Please check back later.", { status: 503 });
            }

            if (lockdownLevel >= 2 && req.method !== "GET" && req.method !== "HEAD") {
                return new NextResponse("Read-Only Mode Active. Modifications are temporarily disabled.", { status: 403 });
            }

            if (lockdownLevel >= 1 && nextUrl.pathname.startsWith("/sign-up")) {
                return NextResponse.redirect(new URL("/sign-in", nextUrl));
            }
        } catch {
            // Redis failure should fail open.
        }
    }

    if (nextUrl.pathname.startsWith("/admin")) {
        if (!hostname.includes("localhost") && !hostname.includes("127.0.0.1")) {
            return NextResponse.redirect(`https://admin.mxlens.com${nextUrl.pathname.replace("/admin", "")}`);
        }
    }

    if (nextUrl.pathname.startsWith("/auth/signup")) {
        return NextResponse.redirect(new URL("/sign-up", nextUrl));
    }

    if (
        nextUrl.pathname.startsWith("/auth") ||
        nextUrl.pathname.startsWith("/api/auth") ||
        nextUrl.pathname === "/login"
    ) {
        return NextResponse.redirect(new URL("/sign-in", nextUrl));
    }

    if (isProtectedMainRoute(req)) {
        await auth.protect();
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
        "/__clerk/:path*"
    ]
};
