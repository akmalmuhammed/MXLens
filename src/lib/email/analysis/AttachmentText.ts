import type { ParsedEmailAttachment } from "../scoring/types";

const MAX_BYTES = 2 * 1024 * 1024;

/** Decodes an attachment as text (UTF-8, lenient), capped to keep scanning bounded. */
export function attachmentText(att: ParsedEmailAttachment): string {
    const c = att.content;
    if (!c) return "";
    if (typeof c === "string") return c.slice(0, MAX_BYTES);
    const bytes = c instanceof Uint8Array ? c : new Uint8Array(c);
    try {
        return new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, MAX_BYTES));
    } catch {
        return "";
    }
}

export function attachmentBytes(att: ParsedEmailAttachment): Uint8Array | null {
    const c = att.content;
    if (!c) return null;
    if (typeof c === "string") return new TextEncoder().encode(c);
    return c instanceof Uint8Array ? c : new Uint8Array(c);
}

export function extensionOf(filename: string | null | undefined): string {
    const name = (filename || "").toLowerCase().replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "");
    const dot = name.lastIndexOf(".");
    return dot >= 0 ? name.slice(dot + 1) : "";
}

/** Markup attachment (HTML/SVG/MHT) by extension, MIME type or content sniffing. */
export function markupKind(att: ParsedEmailAttachment, text: string): "svg" | "html" | null {
    const ext = extensionOf(att.filename);
    const mime = (att.mimeType || "").toLowerCase();
    if (ext === "svg" || ext === "svgz" || mime === "image/svg+xml") return "svg";
    if (["html", "htm", "xhtml", "shtml", "mht", "mhtml", "hta"].includes(ext) || mime === "text/html" || mime === "application/xhtml+xml") return "html";
    const head = text.slice(0, 2048).trimStart().toLowerCase();
    if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) return "svg";
    if (head.startsWith("<!doctype html") || head.startsWith("<html") || head.startsWith("<script")) return "html";
    return null;
}
