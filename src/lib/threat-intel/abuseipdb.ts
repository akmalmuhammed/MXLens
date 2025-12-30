
/**
 * AbuseIPDB API Client
 */

export interface AbuseIPDBResult {
    ipAddress: string;
    isPublic: boolean;
    ipVersion: number;
    isWhitelisted: boolean;
    abuseConfidenceScore: number;
    countryCode: string;
    usageType: string;
    isp: string;
    domain: string;
    totalReports: number;
    lastReportedAt: string;
}

export async function checkAbuseIPDB(ip: string): Promise<AbuseIPDBResult | null> {
    const apiKey = process.env.ABUSEIPDB_API_KEY;
    if (!apiKey) return null;

    try {
        const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`, {
            headers: {
                'Key': apiKey,
                'Accept': 'application/json'
            },
            next: { revalidate: 3600 } // Global cache
        });

        if (!response.ok) return null;

        const data = await response.json();
        return data.data;

    } catch (error) {
        console.error(`[AbuseIPDB] Error checking ${ip}:`, error);
        return null;
    }
}
