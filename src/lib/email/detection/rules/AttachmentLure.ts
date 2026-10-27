import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { allRecipients } from "../../analysis/Recipients";
import { extensionOf } from "../../analysis/AttachmentText";
import { toBase64 } from "./MarkupAttachment";

/**
 * Attachment names that are themselves lure evidence:
 *  - the recipient's address (plain or Base64) baked into the filename (per-recipient kits,
 *    Microsoft Q1 2026);
 *  - voicemail / fax / remittance names on file types that cannot carry audio or a fax
 *    (HTML, SVG, PDF), the standard Direct Send and credential-phish pretext.
 */
export class AttachmentLureDetector implements Detector {
    id = "attachment-lure";
    name = "Lure Attachment Name";
    description = "Detects recipient-personalized attachment names and voicemail/fax/remittance pretexts on document types.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['malware'];

    // Audio cannot live in a PDF or HTML file; fax and remittance PDFs are legitimate.
    private audioPretext = /\b(?:v\.?m\b|voice\s?-?mail|voice\s?message|audio\s?message|missed\s?call|caller\s?left|play\s?message|listen)\b/i;
    private pretext = /\b(?:v\.?m\b|voice\s?-?mail|voice\s?message|audio\s?message|missed\s?call|caller\s?left|play\s?message|listen|fax(?:-?msg)?|e-?fax|remittance|payment\s?advice|ach\s?(?:payment|remit)|wire\s?confirm|swift\s?copy|secure\s?message|encrypted\s?message|shared\s?document)\b/i;
    private documentTypes = ["htm", "html", "shtml", "xhtml", "svg", "svgz", "pdf", "mht", "mhtml"];

    detect(context: DetectionContext): DetectionResult | null {
        const recipients = allRecipients(context.header.headers);
        const reasons: string[] = [];
        let penalty = 0;

        for (const att of context.attachments || []) {
            const name = att.filename || "";
            if (!name) continue;
            const lower = name.toLowerCase();
            const ext = extensionOf(name);

            const personal = recipients.find(r => lower.includes(r) || this.hasB64(name, r) || this.hasLocalPart(lower, r));
            if (personal && penalty > -15) {
                penalty = Math.min(penalty, -15);
                reasons.push(`Attachment name "${name}" contains the recipient's own mailbox name/address, a per-recipient phishing kit trait.`);
            }

            const pretextName = name.replace(/[_.-]+/g, " ");
            const markup = ext !== "pdf";
            const pretextHit = markup ? this.pretext.test(pretextName) : this.audioPretext.test(pretextName);
            if (this.documentTypes.includes(ext) && pretextHit) {
                penalty -= markup ? 15 : 10;
                reasons.push(`Attachment "${name}" uses a voicemail/fax/payment pretext on a ${ext.toUpperCase()} file${markup ? ", which opens in the browser instead of playing audio" : ""}.`);
            }
        }

        if (reasons.length === 0) return null;
        return {
            triggered: true,
            score: penalty <= -25 ? 0.8 : 0.6,
            penalty: Math.max(penalty, -30),
            name: this.name,
            reason: reasons.slice(0, 2).join(" "),
        };
    }

    /** Mailbox name as a whole token (QR_alice.smith.png), long enough not to be a common word. */
    private hasLocalPart(lowerName: string, recipient: string): boolean {
        const local = recipient.split("@")[0];
        if (local.length < 6 && !/[._-]/.test(local)) return false;
        if (local.length < 4) return false;
        const escaped = local.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`).test(lowerName);
    }

    private hasB64(name: string, recipient: string): boolean {
        const b64 = toBase64(recipient).replace(/=+$/, "");
        if (b64.length < 8) return false;
        const urlSafe = b64.replace(/\+/g, "-").replace(/\//g, "_");
        return name.includes(b64) || name.includes(urlSafe);
    }
}
