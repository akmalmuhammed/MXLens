/**
 * Abuse.ch Integration (MalwareBazaar & ThreatFox)
 * 
 * MalwareBazaar: Lookup file hashes (MD5, SHA256) to detect malware.
 * ThreatFox: Lookup IPs/Domains for IOCs (Indicators of Compromise).
 */

interface MalwareBazaarResult {
    query_status: string;
    sha256_hash?: string;
    signature?: string;
    file_type?: string;
    delivery_method?: string;
    tags?: string[];
}

interface ThreatFoxResult {
    query_status: string;
    data?: Array<{
        ioc: string;
        threat_type: string;
        threat_type_desc: string;
        malware: string;
        malware_alias: string;
        confidence_level: number;
        first_seen: string;
        reference: string;
        tags: string[];
    }>;
}

const API_KEY = process.env.ABUSECH_API_KEY;

// MalwareBazaar Hash Lookup
export async function checkMalwareBazaar(hash: string): Promise<MalwareBazaarResult | null> {
    try {
        const formData = new FormData();
        formData.append("query", "get_info");
        formData.append("hash", hash);

        const response = await fetch("https://mb-api.abuse.ch/api/v1/", {
            method: "POST",
            body: formData,
            headers: API_KEY ? { "API-KEY": API_KEY } : undefined,
            next: { revalidate: 3600 * 24 } // Cache for 24h as malware status rarely changes back to clean
        });

        if (!response.ok) return null;

        const data: MalwareBazaarResult = await response.json();

        if (data.query_status === "hash_not_found") {
            return null; // Clean/Unknown
        }

        return data;

    } catch (error) {
        console.error(`[MalwareBazaar] Error checking hash ${hash}:`, error);
        return null;
    }
}

// ThreatFox IOC Lookup
export async function checkThreatFox(term: string): Promise<ThreatFoxResult['data'] | null> {
    try {
        const payload = {
            query: "search_ioc",
            search_term: term
        };

        const response = await fetch("https://threatfox-api.abuse.ch/api/v1/", {
            method: "POST",
            body: JSON.stringify(payload),
            headers: {
                "Content-Type": "application/json",
                ...(API_KEY ? { "API-KEY": API_KEY } : {})
            },
            next: { revalidate: 3600 } // Cache for 1h
        });

        if (!response.ok) return null;

        const data: ThreatFoxResult = await response.json();

        if (data.query_status !== "ok" || !data.data) {
            return null;
        }

        return data.data;

    } catch (error) {
        console.error(`[ThreatFox] Error checking ${term}:`, error);
        return null;
    }
}
