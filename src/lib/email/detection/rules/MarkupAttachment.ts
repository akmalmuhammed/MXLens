import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { attachmentText, markupKind } from "../../analysis/AttachmentText";
import { allRecipients } from "../../analysis/Recipients";

/**
 * HTML and SVG attachments are the largest malicious payload class in 2026 (HTML ~31%,
 * SVG ~19% of payload attacks per Microsoft Q1 2026). They open locally in the browser,
 * so they can redirect, smuggle a file, or render a fake sign-in page that posts the
 * password to the attacker (often a Telegram bot) without a single link in the email.
 */
export class MarkupAttachmentDetector implements Detector {
    id = "markup-attachment";
    name = "Weaponized HTML/SVG Attachment";
    description = "Inspects HTML/SVG attachments for scripts, redirects, HTML smuggling, credential capture and obfuscation.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['malware'];

    private checks: { id: string; label: string; weight: number; re: RegExp; svgOnly?: boolean }[] = [
        { id: "svg-script", label: "script inside SVG", weight: 3, re: /<script\b|\son[a-z]{3,20}\s*=|<foreignObject\b|javascript:/i, svgOnly: true },
        { id: "redirect", label: "auto-redirect", weight: 2, re: /\b(?:window|document|top|self)\.location(?:\.href)?\s*=|location\.(?:replace|assign)\s*\(|<meta[^>]{0,200}http-equiv\s*=\s*["']?refresh/i },
        { id: "smuggling", label: "HTML smuggling (file built in the browser)", weight: 3, re: /URL\.createObjectURL\s*\(|msSaveOrOpenBlob|navigator\.msSaveBlob|new\s+Blob\s*\([\s\S]{0,400}\.download\s*=/i },
        { id: "exfil", label: "credentials sent to Telegram/remote script", weight: 3, re: /api\.telegram\.org\/bot|discord(?:app)?\.com\/api\/webhooks|\$\.(?:ajax|post)\s*\([\s\S]{0,300}\.php|fetch\s*\(\s*["'][^"']{0,300}\.php|XMLHttpRequest[\s\S]{0,400}\.php/i },
        { id: "password-field", label: "password field", weight: 2, re: /<input[^>]{0,400}type\s*=\s*["']?password/i },
        { id: "obfuscation", label: "obfuscated script (atob/unescape/eval/fromCharCode)", weight: 1, re: /\batob\s*\(|\bunescape\s*\(|\beval\s*\(|String\.fromCharCode\s*\(|\\x[0-9a-f]{2}(?:\\x[0-9a-f]{2}){20,}|document\.write\s*\(\s*(?:unescape|atob|decodeURIComponent)/i },
        { id: "base64-blob", label: "large embedded base64 payload", weight: 1, re: /[A-Za-z0-9+/]{3000,}={0,2}/ },
        { id: "remote-script", label: "remote script include", weight: 1, re: /<script[^>]{0,200}\ssrc\s*=\s*["']?(?:https?:)?\/\//i }
    ];

    detect(context: DetectionContext): DetectionResult | null {
        const recipients = allRecipients(context.header.headers);
        let worst: { filename: string; kind: string; hits: string[]; weight: number; personalized: boolean } | null = null;

        for (const att of context.attachments || []) {
            const text = attachmentText(att);
            const kind = markupKind(att, text);
            if (!kind) continue;

            const hits: string[] = [];
            let weight = 0;
            for (const c of this.checks) {
                if (c.svgOnly && kind !== "svg") continue;
                if (c.re.test(text)) {
                    hits.push(c.label);
                    weight += c.weight;
                }
            }
            const personalized = this.embedsRecipient(text, recipients);
            if (personalized) {
                hits.push("recipient address embedded");
                weight += 1;
            }
            // One weak trait (a CDN script, an eval) is common in exported HTML reports.
            if (weight === 0 || (weight < 2 && kind !== "svg")) continue;
            if (!worst || weight > worst.weight) {
                worst = { filename: att.filename || "unnamed", kind, hits, weight, personalized };
            }
        }

        if (!worst) return null;
        const severe = worst.weight >= 3;
        return {
            triggered: true,
            score: severe ? 0.95 : 0.6,
            penalty: severe ? -45 : -20,
            name: this.name,
            reason: `${worst.kind.toUpperCase()} attachment ${worst.filename} contains ${worst.hits.join(", ")}. It runs in the browser when opened, outside link scanning.`,
            metadata: worst
        };
    }

    private embedsRecipient(text: string, recipients: string[]): boolean {
        const lower = text.toLowerCase();
        for (const r of recipients) {
            if (lower.includes(r)) return true;
            const b64 = toBase64(r);
            if (b64 && text.includes(b64.replace(/=+$/, ""))) return true;
        }
        return false;
    }
}

export function toBase64(value: string): string {
    try {
        let binary = "";
        for (const b of new TextEncoder().encode(value)) binary += String.fromCharCode(b);
        return btoa(binary);
    } catch {
        return "";
    }
}
