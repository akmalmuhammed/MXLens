
/**
 * WHOIS / RDAP Integration for Domain Age
 * Uses public RDAP endpoints to avoid paid Whois APIs.
 */

// Common RDAP Bootstraps
const RDAP_SERVERS: Record<string, string> = {
    'com': 'https://rdap.verisign.com/com/v1',
    'net': 'https://rdap.verisign.com/net/v1',
    'org': 'https://rdap.publicinterestregistry.net/rdap/org',
    'io': 'https://rdap.nic.io/domain',
    'co': 'https://rdap.nic.co/domain',
    'uk': 'https://rdap.nominet.uk/uk',
    'ca': 'https://rdap.ca.fury.ca/rdap',
    'in': 'https://rdap.registry.in/domain',
    'gov': 'https://rdap.verisign.com/gov/v1',
    // Fallback for everything else (using a reliable public redirector or IANA)
    // Using simple approach: Assume Google's RDAP works for generic lookup or direct IANA
    'default': 'https://rdap.org/domain'
};

interface RDAPResponse {
    events?: Array<{
        eventAction: string;
        eventDate: string;
    }>;
    entities?: Array<{
        vcardArray?: any[];
        roles?: string[];
    }>;
}

export interface DomainAgeResult {
    domain: string;
    createdDate: string; // ISO
    ageDays: number;
    registrar?: string;
    isFresh: boolean; // True if < 30 days old
}

export async function getDomainAge(domain: string): Promise<DomainAgeResult | null> {
    try {
        const tld = domain.split('.').pop()?.toLowerCase() || 'default';
        // Use specific server if known, else fallback to rdap.org which redirects
        const baseUrl = RDAP_SERVERS[tld] || RDAP_SERVERS['default'];
        // Ensure proper URL construction: baseUrl/domain/example.com OR baseUrl/example.com depending on provider
        // Verisign: https://rdap.verisign.com/com/v1/domain/example.com
        // Nic.io: https://rdap.nic.io/domain/example.io
        // Rdap.org: https://rdap.org/domain/example.com (Redirects)

        let url = "";
        if (baseUrl.includes('/domain')) {
            // If URL already ends/contains '/domain', append just the domain
            url = `${baseUrl}/${domain}`;
        } else {
            // Some endpoints like Verisign end in /v1, need /domain/ appended
            url = `${baseUrl}/domain/${domain}`;
        }

        // Fix for rdap.org structure
        if (baseUrl === RDAP_SERVERS['default']) {
            url = `https://rdap.org/domain/${domain}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            // If 404, it might be a subdomain. Try stripping the first part if > 2 parts.
            if (response.status === 404 && domain.split('.').length > 2) {
                const parts = domain.split('.');
                const parentDomain = parts.slice(1).join('.');
                console.log(`[RDAP] ${domain} failed, retrying with parent: ${parentDomain}`);
                return getDomainAge(parentDomain);
            }
            return null;
        }

        const data: RDAPResponse = await response.json();

        // Find creation date
        // Look for 'registration' or 'last changed' if creation missing (fallback)
        const creationEvent = data.events?.find(e =>
            e.eventAction === 'registration' ||
            e.eventAction === 'last changed' // weaker fallback
        );

        if (!creationEvent) return null;

        const createdDate = new Date(creationEvent.eventDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - createdDate.getTime());
        const ageDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Attempt to extract registrar name (best effort from vCard)
        // Usually deep inside entities -> roles: ['registrar'] -> vcardArray
        // Keeping it simple for MVP: just return Age

        return {
            domain,
            createdDate: createdDate.toISOString(),
            ageDays,
            isFresh: ageDays < 30,
            registrar: 'Unknown (RDAP)'
        };

    } catch (e) {
        console.warn(`[RDAP] Failed to check usage for ${domain}:`, e);
        return null;
    }
}
