import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { organizationalDomain } from "../../analysis/Domain";
import { recipientOrgs } from "../../analysis/Recipients";

/**
 * QR phishing without decoding the image: Microsoft saw QR volume grow 146% in Q1 2026,
 * mostly inside PDFs. Two evasions defeat image scanners entirely: QR codes drawn with
 * Unicode block characters and QR codes built from HTML table cells. Both are detectable
 * from the markup, and the "scan with your phone" instruction is a lure on its own.
 */
export class QrLureDetector implements Detector {
    id = "qr-lure";
    name = "QR Code Lure";
    description = "Detects QR codes drawn with text characters or HTML tables, and scan-the-code instructions.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['link'];

    private scanInstruction = /\b(?:scan|use\s+your\s+(?:phone|camera|mobile))\b[\s\S]{0,60}\b(?:qr|barcode|code\s+below|code\s+above|attached\s+code)\b|\bqr\s*-?\s*code\b[\s\S]{0,80}\b(?:scan|camera|phone|mobile)\b/i;
    private lure = /\b(?:sign\s?in|log\s?in|verify|authenticate|mfa|2fa|multi-?factor|password|mailbox|account|document|voicemail|payroll|benefits?|bonus|salary|access)\b/i;

    detect(context: DetectionContext): DetectionResult | null {
        const html = context.emailBody?.html || "";
        const text = `${context.signals.subject || ""} ${context.signals.visibleText || context.emailBody?.text || ""}`;

        const blockChars = (html + (context.emailBody?.text || "")).match(/[▀-▟■▪◼⬛]/g)?.length ?? 0;
        if (blockChars >= 150) {
            return {
                triggered: true,
                score: 0.85,
                penalty: -30,
                name: "QR Code Drawn With Text",
                reason: `Body contains ${blockChars} block characters forming a QR code out of text, a technique that hides the QR link from image scanners.`,
                metadata: { blockChars }
            };
        }

        const cells = html.match(/<td\b[^>]{0,300}(?:bgcolor|background(?:-color)?)\s*[:=]\s*["']?\s*(?:#0{3}(?:0{3})?\b|black|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))/gi)?.length ?? 0;
        if (cells >= 150) {
            return {
                triggered: true,
                score: 0.85,
                penalty: -30,
                name: "QR Code Built From Table Cells",
                reason: `Body contains a grid of ${cells} black table cells, which renders a QR code that image-based QR scanners never see.`,
                metadata: { cells }
            };
        }

        // Verified internal mail (IT's MFA enrollment notice) legitimately says "scan the QR code".
        const s = context.signals;
        const verifiedInternal = s.dmarcResult === "pass" && !s.dmarcBestGuess && !!s.fromDomain
            && recipientOrgs(context.header.headers).includes(organizationalDomain(s.fromDomain));
        if (verifiedInternal) return null;

        const hasImage = /<img\b/i.test(html) || (context.attachments || []).some(a => /^image\/|application\/pdf/i.test(a.mimeType || "") || /\.(?:png|jpe?g|gif|webp|bmp|pdf)$/i.test(a.filename || ""));
        if (this.scanInstruction.test(text) && this.lure.test(text) && hasImage) {
            return {
                triggered: true,
                score: 0.6,
                penalty: -15,
                name: this.name,
                reason: "Message asks the reader to scan a QR code to sign in, verify or open a document. QR links move the click to an unmanaged phone and past link protection.",
                metadata: { instruction: true }
            };
        }
        return null;
    }
}
