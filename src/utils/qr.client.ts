
import QrScanner from 'qr-scanner';

export async function scanImagesForQr(imageUrls: string[]): Promise<string[]> {
    const found: string[] = [];
    const TIMEOUT_MS = 5000;

    for (const url of imageUrls) {
        try {
            // Promise.race to enforce timeout
            const scanPromise = QrScanner.scanImage(url, { returnDetailedScanResult: true });
            const timeoutPromise = new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error("QR Scan Timeout")), TIMEOUT_MS)
            );

            const result = await Promise.race([scanPromise, timeoutPromise])
                .catch(() => null); // Catch timeout or scan error

            // @ts-ignore
            if (result && result.data) {
                // @ts-ignore
                found.push(result.data);
            }
        } catch (e) {
            // Ignore individual image failures
        }
    }

    return found;
}
