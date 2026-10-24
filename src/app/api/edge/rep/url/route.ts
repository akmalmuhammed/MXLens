import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import type { LookupFunction } from "node:net";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT_MS = 5_000;

function isPublicAddress(address: string): boolean {
    const family = isIP(address);
    if (family === 4) {
        const [a, b] = address.split(".").map(Number);
        return !(
            a === 0 || a === 10 || a === 127 || a >= 224 ||
            (a === 100 && b >= 64 && b <= 127) ||
            (a === 169 && b === 254) ||
            (a === 172 && b >= 16 && b <= 31) ||
            (a === 192 && (b === 0 || b === 168)) ||
            (a === 198 && (b === 18 || b === 19 || b === 51)) ||
            (a === 203 && b === 0)
        );
    }
    if (family !== 6) return false;

    const normalized = address.toLowerCase();
    // Permit global-unicast IPv6 only; exclude mapped, local, multicast, and documentation ranges.
    return normalized.startsWith("2") || normalized.startsWith("3")
        ? !normalized.startsWith("2001:db8:") &&
          !normalized.startsWith("2001:0:") &&
          !normalized.startsWith("2002:") &&
          !normalized.startsWith("3fff:")
        : false;
}

async function validateAndResolve(url: URL) {
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
        throw new Error("Unsupported URL");
    }
    const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
    if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
        throw new Error("Private host blocked");
    }

    const records = isIP(hostname)
        ? [{ address: hostname, family: isIP(hostname) as 4 | 6 }]
        : await lookup(hostname, { all: true, verbatim: true });
    if (!records.length || records.some((record) => !isPublicAddress(record.address))) {
        throw new Error("Private or reserved address blocked");
    }
    return records[0];
}

async function headPinned(url: URL): Promise<{ status: number; location?: string }> {
    const address = await validateAndResolve(url);
    const transport = url.protocol === "https:" ? httpsRequest : httpRequest;
    const pinnedLookup: LookupFunction = (_hostname, options, callback) => {
        if (typeof options === "object" && options.all) {
            callback(null, [{ address: address.address, family: address.family }]);
            return;
        }
        callback(null, address.address, address.family);
    };

    return new Promise((resolve, reject) => {
        const request = transport(url, {
            method: "HEAD",
            headers: { "User-Agent": "MXLens-URL-Inspector/1.0" },
            lookup: pinnedLookup,
            timeout: REQUEST_TIMEOUT_MS,
        }, (response) => {
            response.resume();
            resolve({ status: response.statusCode || 0, location: response.headers.location });
        });
        request.on("timeout", () => request.destroy(new Error("Request timed out")));
        request.on("error", reject);
        request.end();
    });
}

export async function GET(req: NextRequest) {
    const value = new URL(req.url).searchParams.get("url");
    if (!value || value.length > 2048) {
        return NextResponse.json({ error: "A URL of at most 2048 characters is required" }, { status: 400 });
    }

    try {
        let current = new URL(value);
        const originalUrl = current.toString();
        let response: { status: number; location?: string } = { status: 0 };
        let redirects = 0;

        while (true) {
            response = await headPinned(current);
            if (![301, 302, 303, 307, 308].includes(response.status) || !response.location) break;
            if (redirects >= MAX_REDIRECTS) throw new Error("Redirect limit exceeded");
            current = new URL(response.location, current);
            redirects++;
        }

        const finalUrl = current.toString();
        const isSuspicious = /(?:^|\.)ngrok(?:\.io|\.app)?$/i.test(current.hostname) || /(?:^|\.)bit\.ly$/i.test(current.hostname);
        return NextResponse.json({
            originalUrl,
            finalUrl,
            statusCode: response.status,
            isRedirected: finalUrl !== originalUrl,
            isSuspicious,
            verdict: isSuspicious ? "suspicious" : "clean"
        }, { headers: { "Cache-Control": "private, max-age=60" } });
    } catch {
        return NextResponse.json({ error: "URL could not be safely inspected" }, { status: 400 });
    }
}
