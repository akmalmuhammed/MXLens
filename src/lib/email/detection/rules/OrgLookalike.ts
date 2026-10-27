import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { organizationalDomain } from "../../analysis/Domain";
import { recipientOrgs } from "../../analysis/Recipients";

const GENERIC_ORG_LABELS = new Set(["gmail", "yahoo", "hotmail", "outlook", "live", "icloud", "proton", "protonmail", "aol", "mail", "email", "example"]);

/**
 * Targeted (often AI-assisted) spear phishing registers domains that look like the
 * *recipient's* company: corp-example.com, corpexample-hr.com, c0rpexample.com.
 * Brand typo lists never contain your own company, so compare every sender, Reply-To and
 * link domain against the recipient organization's name.
 */
export class OrgLookalikeDetector implements Detector {
    id = "org-lookalike";
    name = "Lookalike of Recipient's Organization";
    description = "Detects sender, Reply-To and link domains that imitate the recipient's own organization domain.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['identity'];

    detect(context: DetectionContext): DetectionResult | null {
        const orgs = recipientOrgs(context.header.headers).filter(o => {
            const label = o.split(".")[0];
            return label.length >= 4 && !GENERIC_ORG_LABELS.has(label);
        });
        if (orgs.length === 0) return null;

        const candidates: { where: string; host: string }[] = [];
        if (context.signals.fromDomain) candidates.push({ where: "sender", host: context.signals.fromDomain });
        if (context.signals.replyToDomain) candidates.push({ where: "Reply-To", host: context.signals.replyToDomain });
        if (context.signals.returnPathDomain) candidates.push({ where: "Return-Path", host: context.signals.returnPathDomain });
        for (const u of context.signals.extractedUrls || []) {
            try {
                candidates.push({ where: "link", host: new URL(u).hostname });
            } catch {
                /* ignore */
            }
        }

        for (const org of orgs) {
            const label = org.split(".")[0];
            for (const c of candidates) {
                const host = c.host.toLowerCase().replace(/\.$/, "");
                const hostOrg = organizationalDomain(host);
                if (!hostOrg || hostOrg === org) continue;
                const hostLabel = hostOrg.split(".")[0];
                const squashed = hostLabel.replace(/[-_]/g, "");

                const kind =
                    hostLabel === label ? "same name on a different TLD" :
                    squashed.includes(label) ? "your organization's name with extra words" :
                    label.length >= 6 && distance(squashed, label) <= (label.length >= 10 ? 2 : 1) ? "a one-character variation of your organization's name" :
                    null;
                if (!kind) continue;

                // Extra words in a link host can be a vendor portal (acme-benefits.example);
                // a typo or TLD swap, or any variant in the sender's own address, is not.
                const extraWords = kind === "your organization's name with extra words";
                const penalty = extraWords ? (c.where === "link" ? -15 : -25) : -30;
                return {
                    triggered: true,
                    score: penalty <= -25 ? 0.85 : 0.65,
                    penalty,
                    name: this.name,
                    reason: `The ${c.where} domain ${hostOrg} imitates the recipient's organization ${org} (${kind}).`,
                    metadata: { org, lookalike: hostOrg, where: c.where, kind }
                };
            }
        }
        return null;
    }
}

function distance(a: string, b: string): number {
    if (Math.abs(a.length - b.length) > 2) return 99;
    const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        let diag = prev[0];
        prev[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const tmp = prev[j];
            prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
            diag = tmp;
        }
    }
    return prev[b.length];
}
