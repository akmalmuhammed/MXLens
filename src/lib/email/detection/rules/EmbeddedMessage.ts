import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { organizationalDomain } from "../../analysis/Domain";
import { recipientOrgs } from "../../analysis/Recipients";

// Boilerplate that tenants and kits add; none of it is the sender's own content.
const BOILERPLATE = [
    /caution:?\s*this\s+(?:e-?mail|message)\s+originated\s+from[^.]*\.(?:[^.]*\b(?:safe|sender|links?|attachments?)\b[^.]*\.)*/gi,
    /\bexternal\s+(?:e-?mail|sender)\b[^.]{0,200}\./gi,
    /confidentiality\s+notice:?[\s\S]{0,900}?(?:thank\s+you\.?|prohibited\.|strictly\s+prohibited\.)/gi,
    /this\s+(?:e-?mail|message)\s+(?:and\s+any\s+attachments\s+)?(?:is|are)\s+(?:confidential|intended\s+(?:solely|only))[\s\S]{0,600}?(?:\.|$)/gi
];

/**
 * The "email inside an email" evasion: the delivered message carries only a disclaimer
 * and the lure travels as an attached .eml, which many gateways and analyzers do not
 * open. The attached email is often forged to look internal (hr@your-company) and was
 * never actually sent (no Received headers).
 */
export class EmbeddedMessageDetector implements Detector {
    id = "embedded-message";
    name = "Lure Hidden in Attached Email";
    description = "Detects attached .eml messages that carry the real content, forge an internal sender, or were never delivered.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['identity', 'malware'];

    detect(context: DetectionContext): DetectionResult | null {
        const embedded = context.signals.embeddedMessages || [];
        if (embedded.length === 0) return null;

        const myOrgs = recipientOrgs(context.header.headers);
        const outerOrg = context.signals.fromDomain ? organizationalDomain(context.signals.fromDomain) : "";
        const reasons: string[] = [];
        let penalty = 0;

        const forgedInternal = embedded.find(m => m.fromDomain && myOrgs.includes(organizationalDomain(m.fromDomain)) && !myOrgs.includes(outerOrg));
        if (forgedInternal) {
            penalty -= 25;
            reasons.push(`the attached email "${forgedInternal.filename}" claims to be from your organization (${forgedInternal.from}) but was delivered by ${outerOrg || "an external sender"}`);
        }

        const neverSent = embedded.find(m => !m.hasReceived);
        if (neverSent) {
            penalty -= 15;
            reasons.push(`the attached email has no delivery (Received) headers, so it was composed as a file, not forwarded from a real mailbox`);
        }

        let outer = context.signals.outerVisibleText || "";
        for (const re of BOILERPLATE) outer = outer.replace(re, " ");
        outer = outer.replace(/\s+/g, " ").trim();
        // A colleague forwarding a message "as attachment" with just "FYI" is normal.
        if (outer.length < 40 && !myOrgs.includes(outerOrg)) {
            penalty -= 15;
            reasons.push("the message itself has no content besides banners/disclaimers, so the lure is only in the attachment (scanner evasion)");
        }

        if (penalty === 0) return null;
        penalty = Math.max(penalty, -45);
        return {
            triggered: true,
            score: penalty <= -25 ? 0.9 : 0.6,
            penalty,
            name: this.name,
            reason: `Lure hidden in an attached email: ${reasons.join("; ")}.`,
            metadata: { embedded }
        };
    }
}
