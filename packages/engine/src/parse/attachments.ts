import type { AttachmentInfo } from "../types.ts";

export interface RawAttachment {
    filename: string | null;
    mimeType: string;
    disposition: string | null;
    content: Uint8Array;
}

export function toBytes(content: ArrayBuffer | Uint8Array | string): Uint8Array {
    if (typeof content === "string") return new TextEncoder().encode(content);
    return content instanceof Uint8Array ? content : new Uint8Array(content);
}

export async function sha256Hex(bytes: Uint8Array): Promise<string | null> {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) return null;
    const digest = await subtle.digest("SHA-256", bytes as unknown as ArrayBuffer);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function startsWith(bytes: Uint8Array, sig: number[], offset = 0): boolean {
    if (bytes.length < offset + sig.length) return false;
    return sig.every((b, i) => bytes[offset + i] === b);
}

function asciiPrefix(bytes: Uint8Array, length = 512): string {
    let s = "";
    for (let i = 0; i < Math.min(length, bytes.length); i++) s += String.fromCharCode(bytes[i]);
    return s;
}

/** Identifies a file from its first bytes. Returns null when unknown. */
export function detectType(bytes: Uint8Array): string | null {
    if (startsWith(bytes, [0x4d, 0x5a])) return "pe-executable";
    if (startsWith(bytes, [0x7f, 0x45, 0x4c, 0x46])) return "elf-executable";
    if (startsWith(bytes, [0xcf, 0xfa, 0xed, 0xfe]) || startsWith(bytes, [0xfe, 0xed, 0xfa, 0xcf])) return "macho-executable";
    if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) return "pdf";
    if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) || startsWith(bytes, [0x50, 0x4b, 0x05, 0x06])) return "zip";
    if (startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return "ole";
    if (startsWith(bytes, [0x52, 0x61, 0x72, 0x21])) return "rar";
    if (startsWith(bytes, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) return "7z";
    if (startsWith(bytes, [0x1f, 0x8b])) return "gzip";
    if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])) return "png";
    if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
    if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return "gif";
    if (startsWith(bytes, [0x7b, 0x5c, 0x72, 0x74, 0x66])) return "rtf";
    if (startsWith(bytes, [0x4c, 0x00, 0x00, 0x00, 0x01, 0x14, 0x02, 0x00])) return "lnk";
    if (startsWith(bytes, [0x43, 0x44, 0x30, 0x30, 0x31], 0x8001)) return "iso";
    const head = asciiPrefix(bytes).trimStart().toLowerCase();
    if (/^(<!doctype html|<html|<head|<body|<script|<form|<meta|<iframe)/.test(head)) return "html";
    if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) return "svg";
    if (head.startsWith("begin:vcalendar")) return "text";
    // Mostly printable bytes: plain text.
    const sample = bytes.subarray(0, Math.min(bytes.length, 512));
    if (sample.length > 0) {
        let printable = 0;
        for (const b of sample) if (b === 9 || b === 10 || b === 13 || (b >= 32 && b < 127) || b >= 0xc2) printable++;
        if (printable / sample.length > 0.95) return "text";
    }
    return null;
}

export function extensionOf(filename: string): string {
    const clean = filename.replace(/[‎‏‪-‮⁦-⁩]/g, "").trim().toLowerCase();
    const dot = clean.lastIndexOf(".");
    return dot >= 0 ? clean.slice(dot + 1).replace(/[^a-z0-9-]/g, "") : "";
}

interface ZipListing { entries: string[]; encrypted: boolean }

/** Lists a ZIP's entries from its central directory. Reads names only; never decompresses. */
export function listZip(bytes: Uint8Array): ZipListing | null {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    // Find the End Of Central Directory record (search the last 64 KiB + 22 bytes).
    let eocd = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
        if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    const entries: string[] = [];
    let encrypted = false;
    const decoder = new TextDecoder();
    if (eocd >= 0) {
        const count = view.getUint16(eocd + 10, true);
        let offset = view.getUint32(eocd + 16, true);
        for (let n = 0; n < count && offset + 46 <= bytes.length; n++) {
            if (view.getUint32(offset, true) !== 0x02014b50) break;
            const flags = view.getUint16(offset + 8, true);
            const nameLen = view.getUint16(offset + 28, true);
            const extraLen = view.getUint16(offset + 30, true);
            const commentLen = view.getUint16(offset + 32, true);
            if (flags & 1) encrypted = true;
            entries.push(decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLen)));
            offset += 46 + nameLen + extraLen + commentLen;
            if (entries.length >= 500) break;
        }
        return { entries, encrypted };
    }
    // Truncated archive: fall back to local file headers.
    let offset = 0;
    while (offset + 30 <= bytes.length && view.getUint32(offset, true) === 0x04034b50 && entries.length < 500) {
        const flags = view.getUint16(offset + 6, true);
        const compSize = view.getUint32(offset + 18, true);
        const nameLen = view.getUint16(offset + 26, true);
        const extraLen = view.getUint16(offset + 28, true);
        if (flags & 1) encrypted = true;
        entries.push(decoder.decode(bytes.subarray(offset + 30, offset + 30 + nameLen)));
        if (flags & 8 || compSize === 0) break;
        offset += 30 + nameLen + extraLen + compSize;
    }
    return entries.length ? { entries, encrypted } : null;
}

/** True when an OLE (legacy Office) file contains a VBA project. */
export function oleHasMacros(bytes: Uint8Array): boolean {
    // Directory entry names are UTF-16LE; "_VBA_PROJECT" and "VBA" streams mark macros.
    const needle = "_\u0000V\u0000B\u0000A\u0000_\u0000P\u0000R\u0000O\u0000J\u0000E\u0000C\u0000T\u0000";
    const limit = Math.min(bytes.length, 4 * 1024 * 1024);
    let s = "";
    for (let i = 0; i < limit; i++) s += String.fromCharCode(bytes[i]);
    return s.includes(needle) || s.includes("Attribute VB_");
}

export async function inspectAttachment(raw: RawAttachment): Promise<AttachmentInfo> {
    const filename = raw.filename ?? "(unnamed)";
    const detected = detectType(raw.content);
    let archiveEntries: string[] = [];
    let encryptedArchive = false;
    if (detected === "zip") {
        const listing = listZip(raw.content);
        if (listing) {
            archiveEntries = listing.entries;
            encryptedArchive = listing.encrypted;
        }
    }
    return {
        filename,
        contentType: raw.mimeType,
        size: raw.content.byteLength,
        sha256: await sha256Hex(raw.content),
        detectedType: detected,
        archiveEntries,
        encryptedArchive,
        flags: [],
    };
}
