import { Detector, DetectionContext, DetectionResult } from "../Detector";

export class OpenRedirectDetector implements Detector {
    id = "open-redirect";
    name = "Open Redirect";
    description = "Detects trusted domains being used to redirect to untrusted sites.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['link'];

    // Common redirect params
    private redirectParams = ["url", "dest", "target", "next", "redirect", "r", "u", "go", "adurl", "q", "uddg", "continue", "returnurl", "redirect_uri", "to"];
    // Trusted redirectors that phishing campaigns route through to borrow reputation.
    private abusedDomains = ["google.com/url", "bing.com", "linkedin.com", "facebook.com/l.php", "l.facebook.com", "lm.facebook.com",
        "youtube.com/redirect", "googleadservices.com", "doubleclick.net", "duckduckgo.com/l/", "t.co", "baidu.com/link",
        "l.instagram.com", "away.vk.com", "click.snapchat.com", "track.adform.net"];

    detect(context: DetectionContext): DetectionResult | null {
        if (!context.signals.extractedUrls || context.signals.extractedUrls.length === 0) return null;

        for (const urlStr of context.signals.extractedUrls) {
            try {
                // 1. Is it a known abused domain?
                // Match on host (+ path) only, so a domain appearing in a query string does not count.
                const parsed = new URL(urlStr);
                const hostPath = `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname}`;
                const host = parsed.hostname.toLowerCase();
                const isAbused = this.abusedDomains.some(d => {
                    const slash = d.indexOf("/");
                    const dHost = slash < 0 ? d : d.slice(0, slash);
                    const dPath = slash < 0 ? "/" : d.slice(slash);
                    return (host === dHost || host.endsWith(`.${dHost}`)) && parsed.pathname.startsWith(dPath);
                });

                // google.com/amp/s/<target> carries the destination in the path.
                if (/^(?:[a-z]+\.)?google\.[a-z.]+\/amp\/s\//i.test(hostPath)) {
                    return {
                        triggered: true,
                        score: 0.6,
                        penalty: -10,
                        name: this.name,
                        reason: `Potential Open Redirect: Google AMP link forwards to ${hostPath.split("/amp/s/")[1]?.split("/")[0] || "an external site"}`,
                    };
                }

                if (isAbused) {
                    const url = new URL(urlStr);
                    // 2. Does it have a redirect param? ("q" only counts for google.com/url,
                    // where it is the target; elsewhere it is a search query.)
                    const params = hostPath.includes("google.") && parsed.pathname === "/url" ? this.redirectParams : this.redirectParams.filter(p => p !== "q");
                    for (const param of params) {
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

            } catch {
                // Invalid URL, ignore
            }
        }

        return null;
    }
}
