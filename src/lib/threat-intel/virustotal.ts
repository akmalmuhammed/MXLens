
/**
 * VirusTotal Threat Intelligence Integration
 * 
 * Provides reputation scores for:
 * - IP Addresses
 * - Domains
 * - File Hashes
 */

interface VirusTotalStats {
    harmless: number;
    malicious: number;
    suspicious: number;
    undetected: number;
    timeout: number;
}

export interface ThreatIntelResult {
    target: string;
    type: 'ip' | 'domain' | 'hash';
    reputation: number; // calculated score 0-100 (100 = malicious)
    stats: VirusTotalStats;
    lastAnalysisDate: string;
    verdict: 'clean' | 'suspicious' | 'malicious' | 'unknown';
    provider: 'VirusTotal' | 'AbuseIPDB' | 'GoogleSafeBrowsing' | 'Whois/RDAP' | 'DomainAge' | 'URLhaus' | 'PhishTank';
    error?: string;
    domainAge?: {
        days: number;
        createdDate: string;
        registrar?: string;
    };
}

const VT_API_BASE = "https://www.virustotal.com/api/v3";

/**
 * Fetch generic threat report from VirusTotal
 */
async function fetchVT(endpoint: string): Promise<any> {
    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    if (!apiKey) {
        throw new Error("VIRUSTOTAL_API_KEY is not configured");
    }

    const response = await fetch(`${VT_API_BASE}/${endpoint}`, {
        headers: {
            'x-apikey': apiKey,
            'Accept': 'application/json'
        },
        next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
        if (response.status === 404) return null;
        if (response.status === 429) throw new Error("Rate limit exceeded");
        throw new Error(`VirusTotal API error: ${response.status}`);
    }

    return await response.json();
}

/**
 * Check IP Reputation
 */
export async function checkIPReputation(ip: string): Promise<ThreatIntelResult | null> {
    try {
        const data = await fetchVT(`ip_addresses/${ip}`);
        if (!data) return null;

        const stats = data.data.attributes.last_analysis_stats;
        return formatResult(ip, 'ip', stats, data.data.attributes.last_analysis_date);
    } catch (error) {
        console.error(`[VT] Error checking IP ${ip}:`, error);
        return {
            target: ip,
            type: 'ip',
            reputation: 0,
            stats: { harmless: 0, malicious: 0, suspicious: 0, undetected: 0, timeout: 0 },
            lastAnalysisDate: new Date().toISOString(),
            verdict: 'unknown',
            provider: 'VirusTotal',
            error: (error as Error).message
        };
    }
}

/**
 * Check Domain Reputation
 */
export async function checkDomainReputation(domain: string): Promise<ThreatIntelResult | null> {
    try {
        const data = await fetchVT(`domains/${domain}`);
        if (!data) return null;

        const stats = data.data.attributes.last_analysis_stats;
        return formatResult(domain, 'domain', stats, data.data.attributes.last_analysis_date);
    } catch (error) {
        console.error(`[VT] Error checking domain ${domain}:`, error);
        return null;
    }
}

/**
 * Helper to normalize VT stats into a ThreatIntelResult
 */
function formatResult(
    target: string,
    type: 'ip' | 'domain' | 'hash',
    stats: VirusTotalStats,
    timestamp: number
): ThreatIntelResult {

    // Calculate a simple risk score (0-100)
    // Malicious count is the strongest signal
    let score = 0;

    if (stats.malicious > 0) score = 100;
    else if (stats.suspicious > 0) score = 50;

    // Verdict
    let verdict: ThreatIntelResult['verdict'] = 'clean';
    if (stats.malicious > 0) verdict = 'malicious';
    else if (stats.suspicious > 1) verdict = 'suspicious';
    else if (stats.harmless === 0 && stats.undetected > 0) verdict = 'unknown';

    return {
        target,
        type,
        reputation: score,
        stats,
        lastAnalysisDate: new Date(timestamp * 1000).toISOString(),
        verdict,
        provider: 'VirusTotal'
    };
}
