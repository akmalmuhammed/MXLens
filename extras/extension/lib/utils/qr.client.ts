
import QrScanner from 'qr-scanner';

export async function scanImagesForQr(imageUrls: string[]): Promise<string[]> {
    const found: string[] = [];

    for (const url of imageUrls) {
        try {
            const result = await QrScanner.scanImage(url, { returnDetailedScanResult: true })
                .catch(() => null);

            if (result && result.data) {
                found.push(result.data);
            }
        } catch (e) {
            // Ignore individual image failures
        }
    }

    return found;
}
