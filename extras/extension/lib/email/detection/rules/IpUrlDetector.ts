import { Detector, DetectionContext, DetectionResult } from "../Detector";

export class IpUrlDetector implements Detector {
    id = "ip-url";
    name = "Raw IP URL";
    description = "Detects links that use raw IP addresses instead of domains.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['link'];

    // Regex for IP v4
    private ipRegex = /https?:\/\/(?:[0-9]{1,3}\.){3}[0-9]{1,3}/g;

    detect(context: DetectionContext): DetectionResult | null {
        if (!context.signals.extractedUrls || context.signals.extractedUrls.length === 0) return null;

        const ipLinks = context.signals.extractedUrls.filter(url => {
            // Skip common local IPs 127.0.0.1, 192.168...
            if (url.includes("127.0.0.1") || url.includes("localhost")) return false;
            return this.ipRegex.test(url);
        });

        if (ipLinks.length > 0) {
            return {
                triggered: true,
                score: 0.8,
                penalty: -15,
                name: this.name,
                reason: `Detected ${ipLinks.length} link(s) hosting on raw IP addresses.`,
                metadata: { links: ipLinks }
            };
        }

        return null;
    }
}
