import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { organizationalDomain } from "../../analysis/Domain";

interface Brand {
    name: string;
    domains: string[];
    /** Markup that only the brand's own templates carry: asset CDNs, template ids, logo alt text. */
    markers: RegExp[];
}

const BRANDS: Brand[] = [
    { name: "DocuSign", domains: ["docusign.net", "docusign.com"], markers: [/docucdn-[a-z]\.akamaihd\.net/i, /\balt\s*=\s*["']?docu-?sign\b/i, /\bSenderEnvelopeComplete\b/, /\bdocusign\.net\/Signing\b/i] },
    { name: "Microsoft", domains: ["microsoft.com", "microsoftonline.com", "office.com", "office365.com", "sharepoint.com", "sharepointonline.com", "outlook.com", "live.com", "microsoft365.com"], // Logo alt text alone is too common in internal IT mail ("Join on Microsoft Teams"); asset CDNs only.
        markers: [/aadcdn\.msft?auth\.net/i, /res-\d?\.?cdn\.office\.net/i, /spoprod-a\.akamaihd\.net/i] },
    { name: "Adobe", domains: ["adobe.com", "adobesign.com", "echosign.com", "adobe.io"], markers: [/(?:static|cdn)\.adobesign\.com|echocdn\.com/i, /\balt\s*=\s*["']?adobe\s+(?:acrobat\s+)?sign\b/i] },
    { name: "Dropbox", domains: ["dropbox.com", "dropboxmail.com"], markers: [/cfl\.dropboxstatic\.com/i, /\balt\s*=\s*["']?dropbox\b/i] },
    { name: "WeTransfer", domains: ["wetransfer.com"], markers: [/wetransfer\.com\/[^"']*\.(?:png|svg|gif)/i, /\balt\s*=\s*["']?wetransfer\b/i] }
];

/**
 * Brand impersonation by template: the email reuses a provider's real notification
 * template (often hot-linking its logo from the provider's own CDN) but was not sent by
 * that provider. Asset hosts look trustworthy to link scanners because they are genuine.
 */
export class BrandTemplateDetector implements Detector {
    id = "brand-template";
    name = "Brand Template Impersonation";
    description = "Detects provider notification templates (DocuSign, Microsoft, Adobe, Dropbox...) sent from other domains.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['identity'];

    detect(context: DetectionContext): DetectionResult | null {
        const html = context.emailBody?.html || "";
        const display = context.signals.fromDisplayName || "";
        const fromOrg = context.signals.fromDomain ? organizationalDomain(context.signals.fromDomain) : "";
        const senders = [fromOrg, ...(context.signals.embeddedMessages || []).map(m => organizationalDomain(m.fromDomain || ""))].filter(Boolean);
        const text = context.signals.visibleText || "";

        for (const brand of BRANDS) {
            const viaName = new RegExp(`\\bvia\\s+${brand.name}\\b`, "i").test(display);
            const marker = brand.markers.find(re => re.test(html));
            if (!marker && !viaName) continue;
            if (senders.some(s => brand.domains.includes(s))) continue;
            // A forwarded genuine notification quotes the brand's sender address; leave it to other rules.
            if (brand.domains.some(d => new RegExp(`@(?:[a-z0-9-]+\\.)*${d.replace(/\./g, "\\.")}\\b`, "i").test(text))) continue;

            const destinations = [...(context.signals.extractedUrls || []), ...(context.signals.qrPayloads || [])]
                .map(u => {
                    try {
                        return organizationalDomain(new URL(u).hostname);
                    } catch {
                        return "";
                    }
                })
                .filter(h => h && !/akamaihd\.net$|cloudfront\.net$|gstatic\.com$/.test(h));
            const offBrand = destinations.filter(h => !brand.domains.includes(h));
            const penalty = offBrand.length > 0 ? -30 : -20;
            const evidence = [viaName ? `display name says "via ${brand.name}"` : "", marker ? `${brand.name} template/logo assets in the HTML` : ""].filter(Boolean).join(" and ");

            return {
                triggered: true,
                score: 0.85,
                penalty,
                name: this.name,
                reason: `${brand.name} impersonation: ${evidence}, but the sender is ${senders.join(" / ") || "unknown"}, not ${brand.domains[0]}${offBrand.length ? `, and the action leads to ${[...new Set(offBrand)].slice(0, 2).join(", ")}` : ""}.`,
                metadata: { brand: brand.name, senders, offBrand }
            };
        }
        return null;
    }
}
