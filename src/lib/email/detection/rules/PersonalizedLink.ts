import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { getHeaderValues } from "../../parser/HeaderUtils";
import { organizationalDomain } from "../../analysis/Domain";

const EMAIL = /[a-z0-9._%+-]{1,64}@[a-z0-9.-]{1,255}\.[a-z]{2,24}/i;
const BENIGN_PATH = /unsubscribe|opt-?out|preferences?|manage|remove|list-?manage/i;

/**
 * Credential-harvesting kits prefill the victim's address in the link
 * (`...?email=victim@corp.example` or `...#victim@corp.example`) so the fake sign-in
 * page can show it back to them. A link to a third-party host carrying the recipient's
 * address is a strong phishing marker; first-party links and unsubscribe flows are ignored.
 */
export class PersonalizedLinkDetector implements Detector {
    id = "personalized-link";
    name = "Recipient-Personalized Link";
    description = "Detects links to third-party hosts that embed the recipient's email address.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['link'];

    detect(context: DetectionContext): DetectionResult | null {
        const urls = context.signals.extractedUrls;
        if (!urls || urls.length === 0) return null;

        const recipients = this.recipients(context);
        const senderOrg = context.signals.fromDomain ? organizationalDomain(context.signals.fromDomain) : "";
        const hits = new Map<string, { matchesRecipient: boolean }>();

        for (const raw of urls) {
            let url: URL;
            try {
                url = new URL(raw);
            } catch {
                continue;
            }
            const host = url.hostname.toLowerCase();
            if (senderOrg && organizationalDomain(host) === senderOrg) continue;
            if (BENIGN_PATH.test(url.pathname)) continue;

            const haystack = this.decode(`${url.search}${url.hash}`);
            const found = haystack.match(EMAIL) ?? this.base64Email(`${url.pathname}${url.search}${url.hash}`);
            if (!found) continue;

            const matchesRecipient = recipients.has(found[0].toLowerCase());
            const previous = hits.get(host);
            hits.set(host, { matchesRecipient: matchesRecipient || previous?.matchesRecipient === true });
        }

        if (hits.size === 0) return null;

        const direct = [...hits.values()].some(h => h.matchesRecipient);
        const hosts = [...hits.keys()].slice(0, 3).join(", ");
        return {
            triggered: true,
            score: direct ? 0.7 : 0.5,
            penalty: direct ? -15 : -10,
            name: this.name,
            reason: direct
                ? `Link to ${hosts} embeds the recipient's own email address. Phishing kits prefill it to make the fake sign-in page look personal.`
                : `Link to ${hosts} carries an email address in its query or fragment.`,
            metadata: { hosts: [...hits.keys()], matchesRecipient: direct }
        };
    }

    private recipients(context: DetectionContext): Set<string> {
        const out = new Set<string>();
        for (const key of ["To", "Cc", "Delivered-To", "X-Original-To"]) {
            for (const value of getHeaderValues(context.header.headers, key)) {
                for (const m of value.matchAll(new RegExp(EMAIL.source, "gi"))) out.add(m[0].toLowerCase());
            }
        }
        return out;
    }

    /** AiTM kits (Tycoon2FA and others) pass the victim as a Base64 token in the path, query or fragment. */
    private base64Email(value: string): RegExpMatchArray | null {
        for (const token of value.match(/[A-Za-z0-9+/_-]{16,400}={0,2}/g) || []) {
            try {
                const decoded = atob(token.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(token.length / 4) * 4, "="));
                const m = decoded.match(EMAIL);
                if (m) return m;
            } catch {
                /* not base64 */
            }
        }
        return null;
    }

    private decode(value: string): string {
        try {
            return decodeURIComponent(value);
        } catch {
            return value;
        }
    }
}
