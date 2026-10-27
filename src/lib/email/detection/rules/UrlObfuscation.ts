import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { extractAnchors } from "../../analysis/HtmlText";

/**
 * URL tricks that hide the real destination or reach outside the browser:
 *  - userinfo: https://login.microsoftonline.com@evil.example/ goes to evil.example
 *  - dangerous schemes: javascript:, data:text/html, vbscript:, file:, UNC (\\host\share
 *    leaks NTLM hashes), search-ms:/ms-msdt:/ms-officecmd: protocol handlers
 *  - numeric hosts: decimal/hex/octal IPv4 (http://3232235777/) and IPv6 literals
 */
export class UrlObfuscationDetector implements Detector {
    id = "url-obfuscation";
    name = "URL Obfuscation";
    description = "Detects userinfo (@) tricks, dangerous URL schemes, UNC paths and numeric/IPv6 hosts.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['link'];

    private dangerousScheme = /^\s*(javascript|vbscript|data|file|search-ms|search|ms-msdt|ms-officecmd|ms-word|ms-excel|ms-powerpoint|ms-appinstaller|ms-cxh|ms-settings|mk|its|mhtml|jar)\s*:/i;

    detect(context: DetectionContext): DetectionResult | null {
        const html = context.emailBody?.html || "";
        const hrefs = [
            ...extractAnchors(html).map(a => a.href),
            ...[...html.matchAll(/<(?:form|iframe|frame|area|button)\b[^>]{0,2000}\b(?:action|src|href|formaction)\s*=\s*["']([^"']{1,2000})["']/gi)].map(m => m[1])
        ];
        const urls = [...hrefs, ...(context.signals.extractedUrls || [])];

        const findings: { label: string; weight: number; example: string }[] = [];
        const add = (label: string, weight: number, example: string) => {
            if (!findings.some(f => f.label === label)) findings.push({ label, weight, example });
        };

        for (const raw of hrefs) {
            const scheme = raw.match(this.dangerousScheme)?.[1]?.toLowerCase();
            if (scheme && !(scheme === "data" && /^\s*data:image\//i.test(raw))) {
                add(`"${scheme}:" link`, scheme === "javascript" || scheme === "vbscript" || scheme === "data" ? 35 : 30, raw.slice(0, 60));
            }
            if (/^\s*(?:\\\\|file:\/\/\/?\\?\\?)[a-z0-9.-]+[\\/]/i.test(raw) && !/^\s*file:\/\/\/[a-z]:/i.test(raw)) {
                add("UNC / remote file link (can leak Windows credentials)", 30, raw.slice(0, 60));
            }
        }

        for (const raw of urls) {
            const m = raw.match(/^\s*https?:\/\/([^/?#\s]+)/i);
            if (!m) continue;
            const authority = m[1];
            const at = authority.lastIndexOf("@");
            if (at > 0) {
                const userinfo = decodeSafe(authority.slice(0, at));
                const host = authority.slice(at + 1);
                if (/[a-z0-9-]+\.[a-z]{2,}/i.test(userinfo)) {
                    add(`userinfo trick: "${userinfo.slice(0, 40)}@" hides the real host ${host}`, 35, raw.slice(0, 80));
                }
            }
            const hostOnly = (at > 0 ? authority.slice(at + 1) : authority).replace(/:\d+$/, "");
            if (/^(?:0x[0-9a-f]{1,8}|\d{8,10})$/i.test(hostOnly) || /^(?:0x[0-9a-f]{1,2}|0[0-7]{1,3}|\d{1,3})(?:\.(?:0x[0-9a-f]{1,2}|0[0-7]{1,3}|\d{1,3})){3}$/i.test(hostOnly) && /(?:^|\.)(?:0x|0\d)/i.test(hostOnly)) {
                add(`numeric-encoded IP host (${hostOnly})`, 30, raw.slice(0, 60));
            }
            if (/^\[[0-9a-f:.]+\]$/i.test(hostOnly)) {
                add(`IPv6 literal host (${hostOnly})`, 20, raw.slice(0, 60));
            }
        }

        if (findings.length === 0) return null;
        findings.sort((a, b) => b.weight - a.weight);
        const penalty = -Math.min(45, findings[0].weight + (findings.length > 1 ? 10 : 0));
        return {
            triggered: true,
            score: penalty <= -35 ? 0.9 : 0.75,
            penalty,
            name: this.name,
            reason: `Obfuscated link: ${findings.map(f => f.label).slice(0, 3).join("; ")}.`,
            metadata: { findings }
        };
    }
}

function decodeSafe(v: string): string {
    try {
        return decodeURIComponent(v);
    } catch {
        return v;
    }
}
