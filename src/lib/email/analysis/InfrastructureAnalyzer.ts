
export interface BrandInfrastructureRule {
    domains: string[]; // e.g., ["google.com", "gmail.com"]
    allowedAsns: string[]; // e.g., ["AS15169"]
    allowedOrgPatterns: RegExp[]; // e.g., [/Google LLC/i]
    critical: boolean; // If true, mismatch is a critical alert
}

export interface InfrastructureVerdict {
    status: 'PASS' | 'FAIL' | 'NEUTRAL';
    brand?: string;
    details?: string;
    riskLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Top Phished Brands & Infrastructure Map
export const BRAND_RULES: Record<string, BrandInfrastructureRule> = {
    "GOOGLE": {
        domains: ["google.com", "gmail.com", "googlemail.com", "youtube.com"],
        allowedAsns: ["AS15169", "AS19527", "AS36040"],
        allowedOrgPatterns: [/^Google/i, /Google LLC/i, /Google Ireland/i],
        critical: true
    },
    "MICROSOFT": {
        domains: ["microsoft.com", "outlook.com", "hotmail.com", "live.com", "office365.com"],
        allowedAsns: ["AS8075", "AS8068", "AS8069", "AS12076"],
        allowedOrgPatterns: [/^Microsoft/i, /Microsoft Corporation/i],
        critical: true
    },
    "AMAZON": {
        domains: ["amazon.com", "aws.amazon.com"],
        allowedAsns: ["AS16509", "AS14618", "AS39111"], // Retail + AWS
        allowedOrgPatterns: [/^Amazon/i, /Amazon.com/i, /Amazon Data Services/i],
        critical: true
    },
    "PAYPAL": {
        domains: ["paypal.com", "mail.paypal.com"],
        allowedAsns: ["AS17012", "AS30277"],
        allowedOrgPatterns: [/^PayPal/i],
        critical: true
    },
    "APPLE": {
        domains: ["apple.com", "icloud.com", "me.com"],
        allowedAsns: ["AS714", "AS6185"],
        allowedOrgPatterns: [/^Apple/i, /Apple Inc/i],
        critical: true
    },
    "FACEBOOK": {
        domains: ["facebook.com", "facebookmail.com", "instagram.com", "whatsapp.com"],
        allowedAsns: ["AS32934", "AS63293"], // Meta
        allowedOrgPatterns: [/^Facebook/i, /^Meta Platforms/i],
        critical: true
    },
    "NETFLIX": {
        domains: ["netflix.com"],
        allowedAsns: ["AS2906", "AS40027"],
        allowedOrgPatterns: [/^Netflix/i],
        critical: true
    },
    "LINKEDIN": {
        domains: ["linkedin.com"],
        allowedAsns: ["AS14413", "AS13335"], // LinkedIn + Cloudflare (often uses MS infra too, handled by MS rule overlaps or specific checks?)
        // LinkedIn is owned by MS but often has distinct ASNs or uses MS
        allowedOrgPatterns: [/^LinkedIn/i, /^Microsoft/i],
        critical: true
    },
    "DROPBOX": {
        domains: ["dropbox.com", "dropboxmail.com"],
        allowedAsns: ["AS19679"],
        allowedOrgPatterns: [/^Dropbox/i],
        critical: true
    },
    // Banks
    "CHASE": {
        domains: ["chase.com", "jpmorganchase.com"],
        allowedAsns: ["AS10885", "AS16999"],
        allowedOrgPatterns: [/^JPMorgan/i, /^Chase/i],
        critical: true
    },
    "WELLS_FARGO": {
        domains: ["wellsfargo.com"],
        allowedAsns: ["AS12185", "AS32706"],
        allowedOrgPatterns: [/^Wells Fargo/i],
        critical: true
    },
    "BOA": {
        domains: ["bankofamerica.com"],
        allowedAsns: ["AS27499", "AS2256"],
        allowedOrgPatterns: [/^Bank of America/i],
        critical: true
    }
};

export class InfrastructureAnalyzer {

    /**
     * Identifying if the sender domain belongs to a known brand and validating its infrastructure
     */
    static validate(
        fromDomain: string,
        ipOrg: string, // Organization from IP Geolocation (e.g., "Google LLC")
        ipAsn?: string // Optional ASN (e.g., "AS15169")
    ): InfrastructureVerdict {

        // 1. Identify Brand
        let matchedBrandKey: string | null = null;
        let rule: BrandInfrastructureRule | null = null;

        for (const [key, r] of Object.entries(BRAND_RULES)) {
            if (r.domains.some(d => fromDomain.toLowerCase().endsWith(d))) {
                matchedBrandKey = key;
                rule = r;
                break;
            }
        }

        // If not a known brand, return neutral (we can't validate unknown infra)
        if (!matchedBrandKey || !rule) {
            return {
                status: 'NEUTRAL',
                riskLevel: 'NONE'
            };
        }

        const cleanOrg = ipOrg.toLowerCase();

        // 2. Check Organization Pattern
        const isOrgMatch = rule.allowedOrgPatterns.some(p => p.test(cleanOrg));

        // 3. Check ASN (if provided)
        let isAsnMatch = false;
        if (ipAsn) {
            // Handle "AS15169 Google LLC" format or just "AS15169"
            const asnCode = ipAsn.split(' ')[0].toUpperCase();
            isAsnMatch = rule.allowedAsns.includes(asnCode);
        }

        // 4. Verdict Logic
        if (isOrgMatch || isAsnMatch) {
            return {
                status: 'PASS',
                brand: matchedBrandKey,
                details: `Authenticated ${matchedBrandKey} Infrastructure (${ipOrg})`,
                riskLevel: 'LOW'
            };
        }

        // MISMATCH DETECTED!
        // Sending as Google but IP is "DigitalOcean" or "Residential"

        // Check if it's a known Email Service Provider (ESP) - Soft Fail
        // Sometimes brands use SendGrid/Salesforce, though big tech usually doesn't
        const isEsp = /SendGrid|Mailgun|Salesforce|HubSpot|Zendesk|Postmark/i.test(cleanOrg);

        if (isEsp) {
            return {
                status: 'FAIL',
                brand: matchedBrandKey,
                details: `Brand (${matchedBrandKey}) sending via Third-Party ESP (${ipOrg}). Unusual for this brand.`,
                riskLevel: 'MEDIUM'
            };
        }

        // Hard Mismatch (High Risk)
        return {
            status: 'FAIL',
            brand: matchedBrandKey,
            details: `CRITICAL: ${matchedBrandKey} email originating from unauthorized infrastructure: ${ipOrg}`,
            riskLevel: 'CRITICAL'
        };
    }
}
