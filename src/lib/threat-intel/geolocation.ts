/**
 * IP Geolocation Service using ipinfo.io
 * Free tier: 50,000 requests/month
 */

export interface GeoLocation {
    ip: string;
    city: string;
    region: string;
    country: string;
    countryCode: string;
    lat: number;
    lng: number;
    org: string;
    timezone: string;
    error?: string;
}

export interface IPHop {
    ip: string;
    location?: GeoLocation;
    hopNumber: number;
    hostname?: string;
}

// Cache to avoid duplicate API calls
const geoCache = new Map<string, GeoLocation>();

/**
 * Get geolocation for a single IP address
 */
export async function getIPGeolocation(ip: string): Promise<GeoLocation | null> {
    // Check cache first
    if (geoCache.has(ip)) {
        return geoCache.get(ip)!;
    }

    // Skip private/local IPs
    if (isPrivateIP(ip)) {
        return {
            ip,
            city: "Private Network",
            region: "",
            country: "Local",
            countryCode: "XX",
            lat: 0,
            lng: 0,
            org: "Private/Internal",
            timezone: ""
        };
    }

    try {
        // Use ipinfo.io API (free tier: 50K/month)
        const token = process.env.IPINFO_TOKEN || ""; // Optional token for higher limits
        const url = token
            ? `https://ipinfo.io/${ip}?token=${token}`
            : `https://ipinfo.io/${ip}/json`;

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 86400 } // Cache for 24 hours
        });

        if (!response.ok) {
            console.error(`[GeoIP] Failed to fetch for ${ip}: ${response.status}`);
            return null;
        }

        const data = await response.json();

        // Parse location coordinates
        const [lat, lng] = (data.loc || "0,0").split(",").map(Number);

        const location: GeoLocation = {
            ip: data.ip || ip,
            city: data.city || "Unknown",
            region: data.region || "",
            country: data.country || "Unknown",
            countryCode: data.country || "XX",
            lat,
            lng,
            org: data.org || "",
            timezone: data.timezone || ""
        };

        // Cache the result
        geoCache.set(ip, location);

        return location;
    } catch (error) {
        console.error(`[GeoIP] Error fetching location for ${ip}:`, error);
        return null;
    }
}

/**
 * Get geolocation for multiple IPs (batch)
 */
export async function getMultipleIPGeolocations(ips: string[]): Promise<Map<string, GeoLocation>> {
    const results = new Map<string, GeoLocation>();
    const uniqueIPs = [...new Set(ips)];

    // Process in parallel with rate limiting (5 concurrent)
    const batchSize = 5;
    for (let i = 0; i < uniqueIPs.length; i += batchSize) {
        const batch = uniqueIPs.slice(i, i + batchSize);
        const promises = batch.map(ip => getIPGeolocation(ip));
        const locations = await Promise.all(promises);

        batch.forEach((ip, idx) => {
            if (locations[idx]) {
                results.set(ip, locations[idx]!);
            }
        });
    }

    return results;
}

/**
 * Extract IPs from email headers (Received headers)
 */
export function extractIPsFromHeaders(headers: Record<string, string | string[]>): string[] {
    const ips: string[] = [];
    const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
    const ipv6Regex = /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g;

    // Look in Received headers primarily
    const receivedHeaders = headers['Received'] || headers['received'] || [];
    const receivedArray = Array.isArray(receivedHeaders) ? receivedHeaders : [receivedHeaders];

    for (const header of receivedArray) {
        const ipv4Matches = header.match(ipRegex) || [];
        const ipv6Matches = header.match(ipv6Regex) || [];
        ips.push(...ipv4Matches, ...ipv6Matches);
    }

    // Also check X-Originating-IP
    const originatingIP = headers['X-Originating-IP'] || headers['x-originating-ip'];
    if (originatingIP) {
        const matches = String(originatingIP).match(ipRegex) || [];
        ips.push(...matches);
    }

    // Deduplicate and filter private IPs for display purposes
    return [...new Set(ips)];
}

/**
 * Check if IP is private/local
 */
function isPrivateIP(ip: string): boolean {
    const parts = ip.split('.').map(Number);

    // 10.0.0.0/8
    if (parts[0] === 10) return true;

    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;

    // 127.0.0.0/8 (localhost)
    if (parts[0] === 127) return true;

    // 0.0.0.0
    if (ip === '0.0.0.0') return true;

    return false;
}

/**
 * Country code to flag emoji
 */
export function countryCodeToFlag(countryCode: string): string {
    if (!countryCode || countryCode === "XX") return "🌐";
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}
