
import { DetectionContext, DetectionResult, Detector } from "../Detector";
// import QrScanner from 'qr-scanner'; // Dynamic import used instead to prevent server crashes

export class QuishingDetector implements Detector {
    id = "QUISHING-001";
    name = "Quishing (QR Phishing) Detector";
    description = "Detects obfuscated malicious payloads hidden inside QR codes.";
    tags: Detector['tags'] = ['malware', 'link'];

    async detect(context: DetectionContext): Promise<DetectionResult | null> {
        // Primary path: payloads decoded by ZXing during normalization (browser, Node and CLI),
        // already merged into extractedUrls so the link rules have scored them.
        const decoded = context.signals.qrPayloads || [];
        // Tickets, Wi-Fi and contact QR codes carry no link; only URL payloads are a lure.
        if (decoded.some(p => /^https?:\/\//i.test(p))) return this.report(decoded);
        if (decoded.length > 0) return null;

        // Fallback: the browser-only scanner (native BarcodeDetector where available).
        if (typeof window === 'undefined') return null;

        const foundUrls: string[] = [];
        const imagesToScan: string[] = [];

        // 1. Extract Inline Base64 Images
        if (context.emailBody?.html) {
            const inlineMatches = context.emailBody.html.match(/src=["'](data:image\/[^;]+;base64,[^"']+)["']/g);
            if (inlineMatches) {
                inlineMatches.forEach(m => {
                    const src = m.match(/src=["']([^"']+)["']/)?.[1];
                    if (src) imagesToScan.push(src);
                });
            }
        }

        // 2. Scan Attachments (if available and are images)
        if (context.attachments) {
            for (const att of context.attachments) {
                if ((att.mimeType && att.mimeType.startsWith('image/')) ||
                    /\.(png|jpg|jpeg|webp|gif|bmp)$/i.test(att.filename || '')) {
                    try {
                        if (att.content) {
                            const bytes = this.toUint8Array(att.content);
                            if (!bytes) continue;
                            const copy = new Uint8Array(bytes.byteLength);
                            copy.set(bytes);
                            const blob = new Blob([copy.buffer], { type: att.mimeType || 'image/png' });
                            const url = URL.createObjectURL(blob);
                            imagesToScan.push(url);
                        }
                    } catch (e) {
                        console.warn("Failed to create blob for attachment", e);
                    }
                }
            }
        }

        // 3. Scan collected images
        if (imagesToScan.length > 0) {
            try {
                // Dynamically import the client-only utility
                // This prevents 'qr-scanner' from being bundled in the main server chunk
                const { scanImagesForQr } = await import('@/utils/qr.client');
                const results = await scanImagesForQr(imagesToScan);
                foundUrls.push(...results);
            } catch (e) {
                console.warn("Retreiving/Executing QR Scanner failed", e);
            } finally {
                // Cleanup Blob URLs
                for (const url of imagesToScan) {
                    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
                }
            }
        }

        // 4. Report Results
        if (foundUrls.length > 0) {
            context.signals.extractedUrls.push(...foundUrls);
            context.signals.suspiciousLinks = context.signals.suspiciousLinks || foundUrls.some(u => u.startsWith('http'));
            return this.report(foundUrls);
        }

        return null;
    }

    private report(payloads: string[]): DetectionResult {
        const urls = payloads.filter(p => /^https?:\/\//i.test(p));
        const hosts = [...new Set(urls.map(u => {
            try {
                return new URL(u).hostname;
            } catch {
                return u;
            }
        }))];
        return {
            triggered: true,
            score: urls.length ? 1.0 : 0.6,
            penalty: urls.length ? -25 : -10,
            name: "Quishing Detected",
            reason: urls.length
                ? `QR code in the message opens ${hosts.slice(0, 2).join(", ")}. Scanning moves the click to a phone, outside link protection.`
                : `QR code in the message contains: ${payloads[0].slice(0, 80)}`,
            metadata: { payloads }
        };
    }

    private toUint8Array(content: string | ArrayBuffer | Uint8Array): Uint8Array | null {
        if (content instanceof Uint8Array) return content;
        if (content instanceof ArrayBuffer) return new Uint8Array(content);
        if (typeof content === 'string') return new TextEncoder().encode(content);
        return null;
    }
}
