"use client";

// Dynamic import of PDF.js to avoid bundling in main chunk
// Actual import happens in extractLinksFromPdf() when needed

export async function extractLinksFromPdf(pdfBuffer: ArrayBuffer): Promise<string[]> {
    if (typeof window === 'undefined') return []; // Client-side only

    try {
        // Configure worker dynamically
        // Use unpkg or local file. For prototype, use CDN or bundled worker.
        // In Next.js with SWC, standard import usually works if 'pdfjs-dist/build/pdf.worker.min.js' is handled.
        // Safer approach for client-component:
        const pdfjs = await import('pdfjs-dist');
        // @ts-ignore
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

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
