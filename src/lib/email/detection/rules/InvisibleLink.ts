import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { extractAnchors } from "../../analysis/HtmlText";
import { organizationalDomain } from "../../analysis/Domain";

/**
 * An anchor with no visible text or image (typically only `&nbsp;`) is clickable but
 * unseen. Phishing kits use them as an extra, hidden click target, and flag it when it
 * leads somewhere different from the visible call to action.
 */
export class InvisibleLinkDetector implements Detector {
    id = "invisible-link";
    name = "Invisible Link";
    description = "Detects clickable anchors with no visible content, especially to a different host than the visible links.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['link'];

    detect(context: DetectionContext): DetectionResult | null {
        const anchors = extractAnchors(context.emailBody?.html || "");
        if (anchors.length === 0) return null;

        const hostOf = (href: string): string | null => {
            try {
                const u = new URL(href);
                return /^https?:$/.test(u.protocol) ? u.hostname.toLowerCase() : null;
            } catch {
                return null;
            }
        };

        const hidden = anchors.filter(a => a.text.length === 0 && !a.hasImage && hostOf(a.href));
        if (hidden.length === 0) return null;

        const visibleOrgs = new Set(
            anchors
                .filter(a => a.text.length > 0)
                .map(a => hostOf(a.href))
                .filter((h): h is string => !!h)
                .map(organizationalDomain)
        );
        const divergent = hidden.filter(a => !visibleOrgs.has(organizationalDomain(hostOf(a.href)!)));
        const hosts = [...new Set(hidden.map(a => hostOf(a.href)!))].slice(0, 3).join(", ");

        if (divergent.length > 0) {
            return {
                triggered: true,
                score: 0.7,
                penalty: -15,
                name: this.name,
                reason: `Clickable link with no visible text points to ${hosts}, a different site from the visible links.`,
                metadata: { hosts: [...new Set(hidden.map(a => hostOf(a.href)!))] }
            };
        }

        return {
            triggered: true,
            score: 0.4,
            penalty: -5,
            name: this.name,
            reason: `Clickable link with no visible text (${hosts}).`,
            metadata: { hosts: [...new Set(hidden.map(a => hostOf(a.href)!))] }
        };
    }
}
