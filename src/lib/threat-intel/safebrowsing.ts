
/**
 * Google Safe Browsing API V4 Client
 */

export interface SafeBrowsingResult {
    target: string;
    threatType: string;
    platformType: string;
    threatEntryType: string;
    safe: boolean;
}

export async function checkSafeBrowsing(urls: string[]): Promise<SafeBrowsingResult[]> {
    const apiKey = process.env.GOOGLE_SAFE_BROWSING_KEY;
    if (!apiKey || urls.length === 0) return [];

    const uniqueUrls = [...new Set(urls)];

    try {
        const response = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client: {
                    clientId: "mxlens-security-platform",
                    clientVersion: "1.0.0"
                },
                threatInfo: {
                    threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
                    platformTypes: ["ANY_PLATFORM"],
                    threatEntryTypes: ["URL"],
                    threatEntries: uniqueUrls.map(url => ({ url }))
                }
            })
        });

        if (!response.ok) return [];

        const data = await response.json();

        // No matches found = All safe
        if (!data.matches) {
            return uniqueUrls.map(url => ({
                target: url,
                threatType: "NONE",
                platformType: "ALL",
                threatEntryType: "URL",
                safe: true
            }));
        }

        const unsafeMap = new Map<string, any>();
        data.matches.forEach((match: any) => {
            unsafeMap.set(match.threatEntry.url, match);
        });

        return uniqueUrls.map(url => {
            const match = unsafeMap.get(url);
            if (match) {
                return {
                    target: url,
                    threatType: match.threatType,
                    platformType: match.platformType,
                    threatEntryType: match.threatEntryType,
                    safe: false
                };
            }
            return {
                target: url,
                threatType: "NONE",
                platformType: "ALL",
                threatEntryType: "URL",
                safe: true
            };
        });

    } catch (error) {
        console.error("[SafeBrowsing] Error:", error);
        return [];
    }
}
