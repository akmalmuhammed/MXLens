"use server";

import { getIPGeolocation, getMultipleIPGeolocations, GeoLocation } from "@/lib/threat-intel/geolocation";
import { allowEnrichment, isPublicIp } from "@/lib/security/enrichment-guard";

/**
 * Server action to get geolocation for multiple IPs
 * This runs server-side to protect API keys and cache responses
 */
export async function fetchIPGeolocations(ips: string[]): Promise<GeoLocation[]> {
    if (!Array.isArray(ips) || ips.length === 0) return [];
    if (!(await allowEnrichment("geolocation", 30))) return [];

    // Only public IPs leave the server; limit to 20 per request to prevent abuse
    const limitedIPs = Array.from(new Set(ips.filter(ip => typeof ip === "string" && isPublicIp(ip)))).slice(0, 20);

    const results = await getMultipleIPGeolocations(limitedIPs);

    // Convert Map to array while preserving order
    return limitedIPs
        .map(ip => results.get(ip))
        .filter((loc): loc is GeoLocation => loc !== undefined);
}

/**
 * Server action to get geolocation for a single IP
 */
export async function fetchSingleIPGeolocation(ip: string): Promise<GeoLocation | null> {
    if (typeof ip !== "string" || !isPublicIp(ip)) return null;
    if (!(await allowEnrichment("geolocation", 30))) return null;
    return await getIPGeolocation(ip);
}
