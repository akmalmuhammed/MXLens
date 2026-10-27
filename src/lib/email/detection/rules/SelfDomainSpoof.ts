import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { getHeaderValues } from "../../parser/HeaderUtils";
import { organizationalDomain } from "../../analysis/Domain";

const EMAIL = /[a-z0-9._%+-]{1,64}@([a-z0-9.-]{1,255}\.[a-z]{2,24})/gi;

/**
 * Attackers often send "from" the victim organization's own domain to the victim's staff
 * ("noreply@corp.example" to "alice@corp.example") because users trust internal-looking mail.
 * Genuine internal mail is authenticated as internal or passes a real DMARC check; external
 * mail with a self-domain From and no real DMARC pass is spoofing.
 */
export class SelfDomainSpoofDetector implements Detector {
    id = "self-domain-spoof";
    name = "Self-Domain Sender";
    description = "Detects external mail that claims to come from the recipient's own domain without a real DMARC pass.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['identity', 'auth'];

    detect(context: DetectionContext): DetectionResult | null {
        const { signals, header } = context;
        if (!signals.fromDomain || !signals.authenticationResultsPresent) return null;
        if (header.exchange?.authAs?.toLowerCase() === "internal") return null;

        const fromOrg = organizationalDomain(signals.fromDomain);
        const recipientOrgs = new Set<string>();
        for (const key of ["To", "Cc", "Delivered-To"]) {
            for (const value of getHeaderValues(header.headers, key)) {
                for (const m of value.matchAll(EMAIL)) recipientOrgs.add(organizationalDomain(m[1]));
            }
        }
        if (recipientOrgs.size !== 1 || !recipientOrgs.has(fromOrg)) return null;

        // A verified DMARC pass (not the receiver's "bestguesspass") is real authentication.
        if (signals.dmarcResult === "pass" && !signals.dmarcBestGuess) return null;

        // Direct Send: unauthenticated SMTP straight to <tenant>.mail.protection.outlook.com lets
        // anyone deliver "internal" mail; it is usually self-addressed (user -> same user).
        const received = getHeaderValues(header.headers, "Received").join("\n");
        const directSend = /\.mail\.protection\.outlook\.com/i.test(received) && !header.originAuth
            && header.exchange?.authAs?.toLowerCase() === "anonymous";
        const fromAddress = (getHeaderValues(header.headers, "From")[0] || "").match(/[a-z0-9._%+-]+@[a-z0-9.-]+/i)?.[0]?.toLowerCase();
        const toAddresses = [...(getHeaderValues(header.headers, "To").join(",")).matchAll(EMAIL)].map(m => m[0].toLowerCase());
        const selfAddressed = !!fromAddress && toAddresses.length === 1 && toAddresses[0] === fromAddress;

        const bare = signals.fromDisplayName.trim().toLowerCase();
        const nameIsDomain = bare === signals.fromDomain || bare === fromOrg;
        const reasons = [`Sender domain ${fromOrg} matches the recipient's own domain, yet the message arrived from outside without a verified DMARC pass.`];
        if (nameIsDomain) reasons.push("The display name is just the domain name, which makes it look system-generated.");
        if (selfAddressed) reasons.push("It is addressed from the recipient to themselves.");
        if (directSend) reasons.push("It entered Microsoft 365 anonymously through the tenant's smart host, consistent with Direct Send abuse (disable it with Set-OrganizationConfig -RejectDirectSend $true if unused).");

        return {
            triggered: true,
            score: 0.7,
            penalty: Math.max(-35, (nameIsDomain ? -25 : -20) - (selfAddressed ? 5 : 0) - (directSend ? 5 : 0)),
            name: this.name,
            reason: reasons.join(" "),
            metadata: { domain: fromOrg, displayNameIsDomain: nameIsDomain, selfAddressed, directSend }
        };
    }
}
