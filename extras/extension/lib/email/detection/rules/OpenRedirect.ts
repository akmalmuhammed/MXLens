import { Detector, DetectionContext, DetectionResult } from "../Detector";

export class OpenRedirectDetector implements Detector {
    id = "open-redirect";
    name = "Open Redirect";
    description = "Detects trusted domains being used to redirect to untrusted sites.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['link'];

    // Common redirect params
    private redirectParams = ["url", "dest", "target", "next", "redirect", "r", "u", "go"];
    // Trusted "Open" Redirectors (often abused)
    private abusedDomains = ["google.com/url", "bing.com", "linkedin.com", "facebook.com/l.php"];

    detect(context: DetectionContext): DetectionResult | null {
        if (!context.signals.extractedUrls || context.signals.extractedUrls.length === 0) return null;

        for (const urlStr of context.signals.extractedUrls) {
            try {
                // 1. Is it a known abused domain?
                const isAbused = this.abusedDomains.some(d => urlStr.includes(d));

                if (isAbused) {
                    const url = new URL(urlStr);
                    // 2. Does it have a redirect param?
                    for (const param of this.redirectParams) {
                        const target = url.searchParams.get(param);
                        if (target && (target.startsWith("http") || target.startsWith("//"))) {
                            return {
                                triggered: true,
                                score: 0.6,
                                penalty: -10,
                                name: this.name,
                                reason: `Potential Open Redirect: ${url.hostname} redirects to external target`,
                                metadata: { wrapper: url.hostname, target: target }
                            };
                        }
                    }
                }

            } catch (e) {
                // Invalid URL, ignore
            }
        }

        return null;
    }
}
