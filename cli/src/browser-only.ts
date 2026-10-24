// Replaces src/utils/pdf.client.ts and qr.client.ts in the CLI bundle. PDF link
// extraction and QR decoding need browser APIs (workers, canvas), so the CLI
// skips them instead of bundling ~1 MB of code that would never run.
export async function extractLinksFromPdf(): Promise<string[]> {
    return [];
}

export async function scanImagesForQr(): Promise<string[]> {
    return [];
}
