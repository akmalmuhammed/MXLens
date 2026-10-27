import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { organizationalDomain } from "@/lib/email/analysis/Domain";

/**
 * Flags link destinations hosted the way phishing kits are hosted today:
 *  - IPFS gateways, which are cheap, anonymous and hard to take down
 *  - scripts dropped into a compromised WordPress/CMS plugin, theme or upload directory
 * Pattern based only; the engine never contacts the destination.
 */
export class PhishingKitLinkDetector implements Detector {
    id = "phishing-kit-link";
    name = "Phishing Kit Hosting";
    description = "Detects links to IPFS gateways and scripts planted in compromised CMS directories.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['link'];

    private ipfsGateways = [
        "ipfs.io", "dweb.link", "cf-ipfs.com", "w3s.link", "nftstorage.link",
        "inbrowser.link", "ipfs.eth.limo", "4everland.io", "cloudflare-ipfs.com",
        "gateway.pinata.cloud", "trustless-gateway.link"
    ];
    private ipfsPath = /\/ipfs\/(?:Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z2-7]{20,})/;
    private cidSubdomain = /^(?:baf[a-z2-7]{20,}|Qm[1-9A-HJ-NP-Za-km-z]{44})\./i;
    // Script or page inside a CMS plugin/theme/upload directory, e.g. /wp-content/plugins/x/y/index.php
    private cmsKitPath = /\/wp-(?:content|includes)\/(?:plugins|themes|uploads|mu-plugins)\/[^?#]*\.(?:php\d?|phtml|html?)(?:$|[?#])/i;

    detect(context: DetectionContext): DetectionResult | null {
        const urls = context.signals.extractedUrls;
        if (!urls || urls.length === 0) return null;

        const senderOrg = context.signals.fromDomain ? organizationalDomain(context.signals.fromDomain) : "";
        const ipfsHosts = new Set<string>();
        const kitHosts = new Set<string>();

        for (const raw of urls) {
            let url: URL;
            try {
                url = new URL(raw);
            } catch {
                continue;
            }
            const host = url.hostname.toLowerCase();
            // A sender's own site legitimately has a CMS; the signal is a *foreign* one.
            if (senderOrg && organizationalDomain(host) === senderOrg) continue;

            const onGateway = this.ipfsGateways.some(g => host === g || host.endsWith(`.${g}`));
            if (onGateway || this.cidSubdomain.test(host) || this.ipfsPath.test(url.pathname)) {
                ipfsHosts.add(host);
            }
            if (this.cmsKitPath.test(url.pathname + url.search)) {
                kitHosts.add(host);
            }
        }

        if (ipfsHosts.size === 0 && kitHosts.size === 0) return null;

        const reasons: string[] = [];
        let penalty = 0;
        if (ipfsHosts.size > 0) {
            penalty -= 20;
            reasons.push(`Link hosted on an IPFS gateway (${this.list(ipfsHosts)}). Decentralised hosting is used to dodge takedowns and domain reputation.`);
        }
        if (kitHosts.size > 0) {
            penalty -= 25;
            reasons.push(`Link points to a script inside a CMS plugin/theme/upload directory on ${this.list(kitHosts)}, the signature of a phishing kit planted on a compromised site.`);
        }

        return {
            triggered: true,
            score: ipfsHosts.size > 0 && kitHosts.size > 0 ? 0.9 : 0.75,
            penalty,
            name: this.name,
            reason: reasons.join(" "),
            metadata: { ipfsHosts: [...ipfsHosts], kitHosts: [...kitHosts] }
        };
    }

    private list(hosts: Set<string>): string {
        return [...hosts].slice(0, 3).join(", ");
    }
}
