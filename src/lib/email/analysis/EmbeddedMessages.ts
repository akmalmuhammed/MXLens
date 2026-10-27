import PostalMime from "postal-mime";
import type { ParsedEmailAttachment, ParsedEmailBody } from "../scoring/types";
import { htmlToVisibleText } from "./HtmlText";

export interface EmbeddedMessageInfo {
    filename: string;
    depth: number;
    from: string;
    fromDomain: string;
    to: string;
    subject: string;
    /** The attached message carries Received headers, i.e. it was really delivered once. */
    hasReceived: boolean;
    hasAuthResults: boolean;
}

export interface ExpandedBody {
    body: ParsedEmailBody;
    embedded: EmbeddedMessageInfo[];
    /** Visible text of the outer message only (before attached emails were merged in). */
    outerVisibleText: string;
}

const MAX_DEPTH = 3;
const MAX_MESSAGES = 10;
const MAX_BYTES = 15 * 1024 * 1024;

function bytesOf(c: ParsedEmailAttachment["content"]): Uint8Array | null {
    if (!c) return null;
    if (typeof c === "string") return new TextEncoder().encode(c);
    return c instanceof Uint8Array ? c : new Uint8Array(c);
}

function looksLikeEmail(att: ParsedEmailAttachment, head: string): boolean {
    const mime = (att.mimeType || "").toLowerCase();
    if (mime === "message/rfc822" || mime === "message/global") return true;
    if (/\.eml$/i.test(att.filename || "")) return true;
    // Unlabelled attachments that start with a header block containing From and Subject.
    return /^[\w-]{2,40}:[^\n]*\r?\n/.test(head) && /^from:/im.test(head) && /^subject:/im.test(head);
}

/**
 * Opens attached emails (.eml / message/rfc822) and merges their bodies and attachments
 * into the analysis. Phishing kits wrap the real lure in an attached email so that the
 * delivered message is an innocuous disclaimer and scanners never look inside.
 */
export async function expandEmbeddedMessages(body: ParsedEmailBody): Promise<ExpandedBody> {
    const outerVisibleText = `${body.text || ""} ${htmlToVisibleText(body.html || "")}`.replace(/\s+/g, " ").trim();
    const embedded: EmbeddedMessageInfo[] = [];
    const htmlParts: string[] = [body.html || ""];
    const textParts: string[] = [body.text || ""];
    const attachments: ParsedEmailAttachment[] = [...(body.attachments || [])];

    const queue: { att: ParsedEmailAttachment; depth: number }[] = (body.attachments || []).map(att => ({ att, depth: 1 }));
    while (queue.length > 0 && embedded.length < MAX_MESSAGES) {
        const { att, depth } = queue.shift()!;
        if (depth > MAX_DEPTH) continue;
        const bytes = bytesOf(att.content);
        if (!bytes || bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) continue;
        const raw = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
        if (!looksLikeEmail(att, raw.slice(0, 4096))) continue;

        let inner;
        try {
            inner = await new PostalMime().parse(raw);
        } catch {
            continue;
        }
        const headerBlock = raw.split(/\r?\n\r?\n/, 1)[0] || "";
        const fromAddr = inner.from?.address || "";
        embedded.push({
            filename: att.filename || "attached message",
            depth,
            from: inner.from ? `${inner.from.name ? `${inner.from.name} ` : ""}<${fromAddr}>`.trim() : "",
            fromDomain: (fromAddr.split("@")[1] || "").toLowerCase(),
            to: (inner.to || []).map(t => t.address).filter(Boolean).join(", "),
            subject: inner.subject || "",
            hasReceived: /^received:/im.test(headerBlock),
            hasAuthResults: /^(?:arc-)?authentication-results:/im.test(headerBlock)
        });

        if (inner.html) htmlParts.push(`<div data-mxlens-embedded="${(att.filename || "").replace(/["<>]/g, "")}">${inner.html}</div>`);
        if (inner.text) textParts.push(inner.text);
        for (const a of inner.attachments || []) {
            const child: ParsedEmailAttachment = { filename: a.filename, mimeType: a.mimeType, content: a.content as ArrayBuffer | string };
            attachments.push(child);
            queue.push({ att: child, depth: depth + 1 });
        }
    }

    if (embedded.length === 0) return { body, embedded, outerVisibleText };
    return {
        body: { text: textParts.filter(Boolean).join("\n\n"), html: htmlParts.filter(Boolean).join("\n") || undefined, attachments },
        embedded,
        outerVisibleText
    };
}
