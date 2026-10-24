"use client";

// Dynamic import of PDF.js to avoid bundling in main chunk
// Actual import happens in extractLinksFromPdf() when needed

export async function extractLinksFromPdf(pdfBuffer: ArrayBuffer): Promise<string[]> {
    if (typeof window === 'undefined') return []; // Client-side only

    try {
        // Bundle the worker so attachments are never processed by code fetched from a CDN.
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

        const loadingTask = pdfjs.getDocument({ data: pdfBuffer });
        const pdf = await loadingTask.promise;

        const extractedLinks: string[] = [];
        const numPages = pdf.numPages;

        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const annotations = await page.getAnnotations();

            for (const annotation of annotations) {
                if (annotation.url) {
                    extractedLinks.push(annotation.url);
                }
            }
        }

        return extractedLinks;

    } catch (e) {
        console.warn("PDF Parsing failed:", e);
        return [];
    }
}
