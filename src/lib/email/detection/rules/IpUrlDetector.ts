import { Detector, DetectionContext, DetectionResult } from "../Detector";

export class IpUrlDetector implements Detector {
    id = "ip-url";
    name = "Raw IP URL";
    description = "Detects links that use raw IP addresses instead of domains.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['link'];

    // IPv4 host, optionally with port/path. No /g flag: .test() on a global regex keeps
    // lastIndex between calls and silently skips every other URL.
    private ipRegex = /^https?:\/\/(?:[^@/?#]*@)?((?:[0-9]{1,3}\.){3}[0-9]{1,3})(?:[:/?#]|$)/i;

    detect(context: DetectionContext): DetectionResult | null {
        if (!context.signals.extractedUrls || context.signals.extractedUrls.length === 0) return null;

        const ipLinks = context.signals.extractedUrls.filter(url => {
            const ip = url.match(this.ipRegex)?.[1];
            if (!ip) return false;
            // Loopback, RFC1918 and link-local addresses are internal tooling, not attacker hosting.
            return !/^(?:127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|169\.254\.|0\.)/.test(ip);
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
