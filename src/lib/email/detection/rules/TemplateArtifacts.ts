import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { extractAnchors } from "../../analysis/HtmlText";

/**
 * Mass-mailing kits substitute merge fields such as [[-Email-]] or {{email}} per recipient.
 * When the substitution misses a spot, the raw placeholder leaks into a link or the visible
 * text. Real senders' templates are rendered before they are sent, so a leftover merge tag
 * is a reliable mark of a bulk phishing template.
 */
export class TemplateArtifactsDetector implements Detector {
    id = "template-artifacts";
    name = "Unrendered Template Placeholder";
    description = "Detects leftover merge tags (e.g. [[-Email-]], {{name}}) in links or visible text.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['link', 'content'];

    private mergeTags: RegExp[] = [
        /\[\[-?[A-Za-z_][A-Za-z0-9_]{0,30}-?\]\]/,
        /\{\{\s?[A-Za-z_][A-Za-z0-9_.]{0,30}\s?\}\}/,
        /%%[A-Za-z_][A-Za-z0-9_]{0,30}%%/,
        /##[A-Za-z_][A-Za-z0-9_]{0,30}##/,
        /\$\{[A-Za-z_][A-Za-z0-9_]{0,30}\}/,
        /\{(?:email|user|username|name|link|url|domain)\}/i
    ];

    detect(context: DetectionContext): DetectionResult | null {
        const html = context.emailBody?.html || "";
        const anchors = extractAnchors(html);

        const places: string[] = [];
        const examples = new Set<string>();
        let gmailCopy = false;

        for (const a of anchors) {
            // Gmail rewrites copied links into data-saferedirecturl; the rewritten URL still
            // holds the percent-encoded placeholder the original author left in the link.
            const candidates = [this.decode(a.href), this.decode(a.safeRedirectUrl || "")];
            if (a.safeRedirectUrl) gmailCopy = true;
            for (const c of candidates) {
                const tag = this.firstTag(c);
                if (tag) {
                    examples.add(tag);
                    if (!places.includes("link")) places.push("link");
                }
            }
        }

        const visibleTag = this.firstTag(context.signals.visibleText || context.emailBody?.text || "");
        if (visibleTag) {
            examples.add(visibleTag);
            places.push("visible text");
        }

        if (examples.size === 0) return null;

        const extra = gmailCopy ? " The HTML also carries Gmail redirect rewrites, so the template was copied out of a mailbox and re-sent." : "";
        return {
            triggered: true,
            score: 0.6,
            penalty: -10,
            name: this.name,
            reason: `Template placeholder left unrendered in ${places.join(" and ")}: ${[...examples].slice(0, 3).join(", ")}. Typical of bulk phishing kits.${extra}`,
            metadata: { placeholders: [...examples], gmailCopy }
        };
    }

    private firstTag(value: string): string | null {
        for (const re of this.mergeTags) {
            const m = value.match(re);
            if (m) return m[0];
        }
        return null;
    }

    private decode(value: string): string {
        try {
            return decodeURIComponent(value);
        } catch {
            return value;
        }
    }
}
