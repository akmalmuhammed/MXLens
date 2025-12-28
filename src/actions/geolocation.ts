"use server";

import { getIPGeolocation, getMultipleIPGeolocations, GeoLocation } from "@/lib/threat-intel/geolocation";

/**
 * Server action to get geolocation for multiple IPs
 * This runs server-side to protect API keys and cache responses
 */
export async function fetchIPGeolocations(ips: string[]): Promise<GeoLocation[]> {
    if (!ips || ips.length === 0) return [];

    // Limit to 20 IPs per request to prevent abuse
    const limitedIPs = ips.slice(0, 20);

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
    if (!ip) return null;
    return await getIPGeolocation(ip);
}
