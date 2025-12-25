import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
        return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    try {
        // 1. Trace Redirects (Unshorten)
        const traceRes = await fetch(targetUrl, {
            method: "HEAD", // Don't download body, just headers
            redirect: "follow",
        });

        const finalUrl = traceRes.url;
        const isRedirected = finalUrl !== targetUrl;

        // 2. Mock Safety Check (Replace with Google Safe Browsing API in prod)
        // Checking if the final URL is in a known phishing list would happen here
        const isSuspicious = finalUrl.includes("ngrok") || finalUrl.includes("bit.ly");

        return NextResponse.json({
            originalUrl: targetUrl,
            finalUrl: finalUrl,
            statusCode: traceRes.status,
            isRedirected,
            isSuspicious,
            verdict: isSuspicious ? "suspicious" : "clean"
        }, {
            headers: {
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
            }
        });

    } catch (error) {
        return NextResponse.json({ error: "Trace failed", details: String(error) }, { status: 500 });
    }
}
