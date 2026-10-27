import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { getHeaderValues } from "../../parser/HeaderUtils";
import { organizationalDomain } from "../../analysis/Domain";

/**
 * How the message entered the mail system. "(Authenticated sender: x@a.example)" in the
 * first Received header names the mailbox that logged in to send it; when that mailbox
 * belongs to an unrelated domain, the attacker is using a compromised account (or a
 * hosting relay) and only forging the From. A "[127.0.0.1]" HELO from a public IP is a
 * script, not a mail client.
 */
export class SubmissionAnomalyDetector implements Detector {
    id = "submission-anomaly";
    name = "Sent Through an Unrelated Mailbox";
    description = "Detects messages submitted by an authenticated account on a different domain than the sender.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['identity'];

    detect(context: DetectionContext): DetectionResult | null {
        const fromOrg = context.signals.fromDomain ? organizationalDomain(context.signals.fromDomain) : "";
        if (!fromOrg) return null;
        const rpOrg = context.signals.returnPathDomain ? organizationalDomain(context.signals.returnPathDomain) : "";

        const received = getHeaderValues(context.header.headers, "Received");
        for (const r of received) {
            const auth = r.match(/\(Authenticated\s+sender:\s*([^\s)]+@([a-z0-9.-]+))\)/i);
            if (!auth) continue;
            const account = auth[1].toLowerCase();
            const accountOrg = organizationalDomain(auth[2]);
            if (accountOrg === fromOrg || (rpOrg && accountOrg === rpOrg)) continue;

            const scripted = /^from\s+\[(?:127\.0\.0\.1|::1|localhost)\]\s+\(\S*\s*\[?(?!10\.|127\.|192\.168\.)\d{1,3}(?:\.\d{1,3}){3}/i.test(r.trim());
            return {
                triggered: true,
                score: 0.75,
                penalty: scripted ? -20 : -15,
                name: this.name,
                reason: `The message was submitted by logging in as ${account}, a mailbox unrelated to the sender domain ${fromOrg}${scripted ? ", from a client that announced itself as [127.0.0.1] (a script, not a mail app)" : ""}. Typical of a compromised account used as a relay.`,
                metadata: { account, fromOrg, scripted }
            };
        }
        return null;
    }
}
