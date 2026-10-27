import { readBarcodes } from "zxing-wasm/reader";
import { ensureZXing } from "@/utils/zxing.loader";

const MAX_IMAGES = 20;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
// A small file can declare enormous dimensions (decompression bomb); decoding it would
// allocate width*height*4 bytes. 25 MP covers any real QR screenshot or scan.
const MAX_PIXELS = 25_000_000;

/** Width/height from PNG, GIF, BMP or JPEG headers; null when unknown. */
export function imageDimensions(b: Uint8Array): { width: number; height: number } | null {
    const u32 = (o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
    if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { width: u32(16), height: u32(20) };
    if (b.length > 10 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return { width: b[6] | (b[7] << 8), height: b[8] | (b[9] << 8) };
    if (b.length > 26 && b[0] === 0x42 && b[1] === 0x4d) {
        const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
        return { width: Math.abs(view.getInt32(18, true)), height: Math.abs(view.getInt32(22, true)) };
    }
    if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
        let i = 2;
        while (i + 9 < b.length) {
            if (b[i] !== 0xff) {
                i++;
                continue;
            }
            const marker = b[i + 1];
            const len = (b[i + 2] << 8) | b[i + 3];
            if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
                return { height: (b[i + 5] << 8) | b[i + 6], width: (b[i + 7] << 8) | b[i + 8] };
            }
            i += 2 + len;
        }
    }
    return null;
}

/**
 * Decodes QR (and other 2D) codes from image bytes (PNG, JPEG, GIF, BMP) with ZXing-C++.
 * It runs in the browser and in Node, unlike the old browser-only scanner, and it reads
 * codes jsQR-based scanners miss: dense, high-error-correction codes with no quiet zone,
 * which current QR phishing kits generate. Never throws; returns [] if the reader is
 * unavailable.
 */
export async function decodeQrImages(images: Uint8Array[]): Promise<string[]> {
    const candidates = images.filter(i => {
        if (i.byteLength <= 64 || i.byteLength > MAX_IMAGE_BYTES) return false;
        const dims = imageDimensions(i);
        return !dims || (dims.width > 0 && dims.height > 0 && dims.width * dims.height <= MAX_PIXELS);
    }).slice(0, MAX_IMAGES);
    if (candidates.length === 0) return [];
    try {
        await ensureZXing();
    } catch {
        return [];
    }
    const found = new Set<string>();
    for (const image of candidates) {
        try {
            const results = await readBarcodes(image, {
                formats: ["QRCode", "MicroQRCode", "rMQRCode", "Aztec", "DataMatrix", "PDF417"],
                tryHarder: true,
                tryRotate: true,
                tryInvert: true,
                maxNumberOfSymbols: 8
            });
            for (const r of results) if (r.isValid && r.text) found.add(r.text.trim());
        } catch {
            /* unreadable image */
        }
    }
    return [...found];
}

/** Image bytes from attachments (inline or not) and from data: URIs in the HTML. */
export function collectImages(
    attachments: { filename?: string | null; mimeType?: string; content?: string | ArrayBuffer | Uint8Array }[],
    html: string
): Uint8Array[] {
    const out: Uint8Array[] = [];
    for (const a of attachments) {
        const isImage = /^image\/(?:png|jpe?g|gif|bmp|x-ms-bmp|pjpeg)$/i.test(a.mimeType || "") || /\.(?:png|jpe?g|gif|bmp)$/i.test(a.filename || "");
        if (!isImage || !a.content) continue;
        const c = a.content;
        out.push(typeof c === "string" ? new TextEncoder().encode(c) : c instanceof Uint8Array ? c : new Uint8Array(c));
    }
    for (const m of html.matchAll(/data:image\/(?:png|jpe?g|gif|bmp);base64,([A-Za-z0-9+/=\s]{100,4000000})/gi)) {
        try {
            const bin = atob(m[1].replace(/\s+/g, ""));
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            out.push(bytes);
        } catch {
            /* bad base64 */
        }
    }
    return out;
}
