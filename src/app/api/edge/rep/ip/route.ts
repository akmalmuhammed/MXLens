import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface IpReputation {
    ip: string;
    country: string;
    city: string;
    isp: string;
    isProxy: boolean;
    isDatacenter: boolean;
    riskScore: number;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const ip = searchParams.get("ip");

    if (!ip) {
        return NextResponse.json({ error: "Missing IP address" }, { status: 400 });
    }

    // 1. Geo-Location (Using ip-api.com free tier for demo, switch to Pro in prod)
    // Vercel also provides geo headers: x-vercel-ip-country, etc. if called from the client
    try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,city,isp,hosting,mobile,proxy`);
        const geoData = await geoRes.json();

        if (geoData.status !== "success") {
            return NextResponse.json({ error: "Geo lookup failed" }, { status: 500 });
        }

        const isDatacenter = geoData.hosting === true;
        const isProxy = geoData.proxy === true;

        // Simple heuristic risk score
        let riskScore = 0;
        if (isDatacenter) riskScore += 30;
        if (isProxy) riskScore += 50;

        const result: IpReputation = {
            ip,
            country: geoData.countryCode,
            city: geoData.city,
            isp: geoData.isp,
            isProxy,
            isDatacenter,
            riskScore,
        };

        return NextResponse.json(result, {
            headers: {
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
            },
        });

    } catch (error) {
        return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
    }
}
