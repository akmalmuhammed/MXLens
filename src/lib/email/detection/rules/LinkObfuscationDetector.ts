import { Detector, DetectionContext, DetectionResult } from "../Detector";

export class LinkObfuscationDetector implements Detector {
    id = "link-obfuscation";
    name = "Link Obfuscation Detector";
    description = "Detects evasion techniques like URL shorteners and subdomain chaining.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['link'];

    private shortenerDomains = [
        "bit.ly", "goo.gl", "tinyurl.com", "t.co", "is.gd", "buff.ly", "ow.ly",
        "adcrun.ch", "zws.im", "shorte.st", "bc.vc", "snip.li", "fic.kr", "yhoo.it",
        "lnkd.in", "db.tt", "qr.ae", "adf.ly", "bit.do", "cut.ly", "shorturl.at"
    ];

    private trustedBrands = [
        "paypal", "google", "microsoft", "apple", "amazon", "netflix", "facebook",
        "instagram", "linkedin", "dropbox", "docusign", "adobe", "chase", "wellsfargo"
    ];

    detect(context: DetectionContext): DetectionResult | null {
        if (!context.signals.extractedUrls || context.signals.extractedUrls.length === 0) return null;

        for (const urlStr of context.signals.extractedUrls) {
            try {
                const url = new URL(urlStr);
                const hostname = url.hostname.toLowerCase();

                // 1. URL Shortener Detection
                if (this.shortenerDomains.some(d => hostname === d || hostname.endsWith("." + d))) {
                    return {
                        triggered: true,
                        score: 0.6,
                        penalty: -10,
                        name: "Obfuscated Link (Shortener)",
                        reason: `Detected use of URL shortener (${hostname}) which hides the destination.`,
                        metadata: { url: urlStr }
                    };
                }

                // 2. Subdomain Deception (e.g. login.paypal.com.secure-update.net)
                // Logic: A trusted brand appears in the hostname, but it is NOT the root domain.
                // Exception: The hostname actually IS the trusted brand (paypal.com).

                // Extract root domain (simple heuristic: last 2 parts for .com, .net, etc. - imperfect but effective for mainstream)
                const parts = hostname.split('.');
                if (parts.length >= 3) {
                    const rootDomain = parts.slice(-2).join('.'); // e.g. secure-update.net

                    // Check if a trusted brand is in the SUBDOMAIN part (everything before root)
                    const subdomain = parts.slice(0, -2).join('.');

                    for (const brand of this.trustedBrands) {
                        if (subdomain.includes(brand) && !rootDomain.includes(brand)) {
                            return {
                                triggered: true,
                                score: 0.8,
                                penalty: -25,
                                name: "Subdomain Deception",
                                reason: `Hostname (${hostname}) mimics "${brand}" but is hosted on "${rootDomain}".`,
                                metadata: { brand, root: rootDomain }
                            };
                        }
                    }
                }

            } catch (e) {
                // Invalid URL
            }
        }

        return null;
    }
}
