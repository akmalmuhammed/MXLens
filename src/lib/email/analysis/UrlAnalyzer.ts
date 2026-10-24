import * as cheerio from 'cheerio/slim';
import { get } from 'fast-levenshtein';

export interface LinkAnalysis {
    href: string;
    display: string;
    isMismatched: boolean; // Text says "google.com", Link is "evil.com"
    isSubdomainTrick: boolean; // Link is "google.com.verify.tk"
    isLookalike: boolean; // Text is "G0ogle"
    riskScore: number;
    details: string[];
}

export class UrlAnalyzer {
    // Top brands to check for lookalikes
    private static TOP_BRANDS = [
        "google", "microsoft", "apple", "paypal", "amazon", "netflix",
        "facebook", "instagram", "whatsapp", "linkedin", "dropbox",
        "chase", "wellsfargo", "bankofamerica", "citibank"
    ];

    static analyze(htmlContent: string): LinkAnalysis[] {
        const results: LinkAnalysis[] = [];
        const $ = cheerio.load(htmlContent);

        $('a').each((_, element) => {
            const href = $(element).attr('href')?.trim();
            const display = $(element).text().trim(); // Inner text

            if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return;

            const cleanHref = this.cleanUrl(href);
            const cleanDisplay = this.cleanUrl(display);

            // If display text is NOT a URL, we skip "Mismatch" logic (e.g., text is "Click Here")
            // But we still check for lookalikes in the text if it looks like a brand
            const displayIsUrl = this.looksLikeUrl(display);

            const analysis: LinkAnalysis = {
                href,
                display: display.substring(0, 50) + (display.length > 50 ? '...' : ''),
                isMismatched: false,
                isSubdomainTrick: false,
                isLookalike: false,
                riskScore: 0,
                details: []
            };

            // 1. Mismatch Detection (Bait & Switch)
            if (displayIsUrl) {
                const hrefDomain = this.getDomain(cleanHref);
                const displayDomain = this.getDomain(cleanDisplay);

                if (hrefDomain && displayDomain && hrefDomain !== displayDomain) {
                    // Check if one is a subdomain of the other (allowed)
                    // e.g., display: google.com, href: accounts.google.com -> OK
                    if (!hrefDomain.endsWith(displayDomain) && !displayDomain.endsWith(hrefDomain)) {
                        analysis.isMismatched = true;
                        analysis.riskScore += 50;
                        analysis.details.push(`Link mismatch: Display says "${displayDomain}" but goes to "${hrefDomain}"`);
                    }
                }
            }

            // 2. Subdomain Tricks (paypal.com.evil.com)
            const hrefHostname = this.getHostname(cleanHref);
            if (hrefHostname) {
                for (const brand of this.TOP_BRANDS) {
                    // If hostname STARTS with brand but doesn't end with brand.TLD
                    // e.g. "paypal.com.security-check.com"
                    if (hrefHostname.includes(brand) && !this.isOfficialDomain(hrefHostname, brand)) {
                        // Check if brand is in the SLD (Second Level Domain)
                        const sld = this.getSLD(hrefHostname);
                        if (!sld.includes(brand)) {
                            analysis.isSubdomainTrick = true;
                            analysis.riskScore += 30;
                            analysis.details.push(`Subdomain trickery: "${brand}" found in subdomain of "${sld}"`);
                        }
                    }
                }
            }

            // 3. Lookalike Detection (Typosquatting in Display or Href)
            // Check Display Text for typos of brands (e.g. "PayPai")
            // Only runs if the display text is short (1-3 words) to avoid false positives in sentences
            if (display.split(' ').length < 4) {
                for (const brand of this.TOP_BRANDS) {
                    const cleanDisp = display.toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (cleanDisp.length < 3) continue;

                    // Exact match is fine (if URL matches, checked above)
                    if (cleanDisp === brand) continue;

                    const distance = get(cleanDisp, brand);
                    // Distance 1 means 1 char edit (e.g., PayPa -> PayPal, PayPai -> PayPal)
                    if (distance === 1) {
                        analysis.isLookalike = true;
                        analysis.riskScore += 20;
                        analysis.details.push(`Lookalike text: "${display}" resembles "${brand}"`);
                    }
                }
            }

            if (analysis.riskScore > 0) {
                results.push(analysis);
            }
        });

        return results;
    }

    private static cleanUrl(url: string): string {
        return url.replace(/^(https?:\/\/)?(www\.)?/, '').toLowerCase();
    }

    // Simple heuristic: Does it have a dot and no spaces?
    private static looksLikeUrl(text: string): boolean {
        return text.includes('.') && !text.includes(' ') && text.length > 4;
    }

    private static getHostname(urlStr: string): string | null {
        try {
            // Ensure protocol
            const withProto = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`;
            return new URL(withProto).hostname;
        } catch {
            return null;
        }
    }

    private static getDomain(urlStr: string): string | null {
        // Very basic extraction, gets root domain roughly
        const hostname = this.getHostname(urlStr);
        if (!hostname) return null;
        const parts = hostname.split('.');
        if (parts.length < 2) return hostname;
        return parts.slice(-2).join('.');
    }

    private static getSLD(hostname: string): string {
        const parts = hostname.split('.');
        if (parts.length < 2) return hostname;
        return parts[parts.length - 2]; // "google" from "docs.google.com"
    }

    private static isOfficialDomain(hostname: string, brand: string): boolean {
        // Simplified check. Realworld needs a comprehensive list or flexible logic.
        return hostname.includes(`${brand}.com`) || hostname.includes(`${brand}.net`) || hostname.includes(`${brand}.org`);
    }
}
