import "server-only";

import { headers } from "next/headers";
import { isEnrichmentEnabled } from "@/lib/config";

/**
 * Guards for the enrichment server actions (threat intel, geolocation, DNS).
 *
 * Enrichment sends indicators (IPs, domains, hashes) to third-party services, so it
 * is off unless the operator sets MXLENS_ENRICHMENT=true. When on, the actions are
 * callable by anyone who can reach the server and spend the operator's API quotas,
 * so every call is rate limited per client IP with an in-memory window.
 */

const memoryWindows = new Map<string, number[]>();

function memoryLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const hits = (memoryWindows.get(key) ?? []).filter((t) => now - t < windowMs);
    if (hits.length >= limit) {
        memoryWindows.set(key, hits);
        return false;
    }
    hits.push(now);
    memoryWindows.set(key, hits);
    if (memoryWindows.size > 10_000) {
        // Bound memory: drop the oldest key.
        const oldest = memoryWindows.keys().next().value;
        if (oldest !== undefined) memoryWindows.delete(oldest);
    }
    return true;
}

async function clientIp(): Promise<string> {
    const h = await headers();
    return (
        h.get("x-real-ip")?.trim() ||
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown"
    );
}

/**
 * Returns true when enrichment is enabled and the caller is within the limit for
 * this bucket (per minute).
 */
export async function allowEnrichment(bucket: string, perMinute: number): Promise<boolean> {
    if (!isEnrichmentEnabled()) return false;
    const key = `enrich:${bucket}:${await clientIp()}`;
    return memoryLimit(key, perMinute, 60_000);
}

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/**
 * True only for globally routable unicast addresses. Private, loopback, link-local,
 * CGNAT, multicast and reserved ranges are internal infrastructure and must never be
 * sent to third-party reputation services.
 */
export function isPublicIp(value: string): boolean {
    const ip = value.trim().toLowerCase();
    const v4 = IPV4.exec(ip.startsWith("::ffff:") ? ip.slice(7) : ip);
    if (v4) {
        const [a, b, c] = [Number(v4[1]), Number(v4[2]), Number(v4[3])];
        if ([a, b, Number(v4[3]), Number(v4[4])].some((n) => n > 255)) return false;
        if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
        if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT
        if (a === 169 && b === 254) return false; // link-local
        if (a === 172 && b >= 16 && b <= 31) return false;
        if (a === 192 && b === 168) return false;
        if (a === 192 && b === 0 && (c === 0 || c === 2)) return false; // IETF, TEST-NET-1
        if (a === 198 && (b === 18 || b === 19)) return false; // benchmarking
        if (a === 198 && b === 51 && c === 100) return false; // TEST-NET-2
        if (a === 203 && b === 0 && c === 113) return false; // TEST-NET-3
        return true;
    }
    if (ip.includes(":")) {
        if (ip === "::" || ip === "::1") return false;
        if (/^f[cd]/.test(ip)) return false; // unique local fc00::/7
        if (/^fe[89ab]/.test(ip)) return false; // link-local fe80::/10
        if (ip.startsWith("ff")) return false; // multicast
        if (ip.startsWith("2001:db8")) return false; // documentation
        return /^[0-9a-f:]+$/.test(ip);
    }
    return false;
}

const DOMAIN = /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i;
const INTERNAL_SUFFIXES = [".local", ".internal", ".lan", ".corp", ".home", ".localhost", ".intranet"];

/** True for a syntactically valid public-looking hostname (no internal suffixes). */
export function isPublicDomain(value: string): boolean {
    const domain = value.trim().toLowerCase().replace(/\.$/, "");
    if (!DOMAIN.test(domain)) return false;
    return !INTERNAL_SUFFIXES.some((suffix) => domain.endsWith(suffix));
}

const HASH = /^(?:[a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64})$/i;

export function isFileHash(value: string): boolean {
    return HASH.test(value.trim());
}
