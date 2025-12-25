import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Top 50 common disposable domains (In prod, fetch this from Edge Config or CDN)
const DISPOSABLE_DOMAINS = new Set([
    "10minutemail.com", "guerrillamail.com", "sharklasers.com", "yopmail.com", "mailinator.com",
    "temp-mail.org", "throwawaymail.com", "maildrop.cc", "getnada.com", "dispostable.com",
    "fakemail.net", "tempr.email", "trashmail.com", "mail.tm", "tempmail.net"
]);

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain")?.toLowerCase();

    if (!domain) {
        return NextResponse.json({ error: "Missing domain" }, { status: 400 });
    }

    const isDisposable = DISPOSABLE_DOMAINS.has(domain);

    return NextResponse.json({
        domain,
        isDisposable,
        riskScore: isDisposable ? 100 : 0
    }, {
        headers: {
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600", // Cache for 24h
        }
    });
}
