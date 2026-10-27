import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { getHeaderValues } from "../../parser/HeaderUtils";
import { organizationalDomain } from "../../analysis/Domain";

/**
 * The oldest Received header shows where the message entered the mail system. A message
 * handed over by a local process ("from helo.example (localhost [::1])") on a host unrelated
 * to the From domain, whose sender domain also failed SPF/DMARC at the first evaluation, was
 * sent by a script on someone else's server rather than by the claimed sender's mail system.
 */
export class LocalMailInjectionDetector implements Detector {
    id = "local-mail-injection";
    name = "Local Mail Injection";
    description = "Detects messages injected by a local process on a host unrelated to the sender domain.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['identity'];

    detect(context: DetectionContext): DetectionResult | null {
        const { signals, header } = context;
        if (!signals.fromDomain) return null;

        const origin = header.originAuth;
        const originFailed = !!origin && (origin.dmarc === "fail" || origin.spf === "fail" || origin.spf === "softfail");
        if (!originFailed) return null;

        const received = getHeaderValues(header.headers, "Received");
        const oldest = received[received.length - 1];
        if (!oldest) return null;

        const m = oldest.match(/^\s*from\s+(\S+)\s+\((?:[^)]*\b)?(?:localhost|127\.0\.0\.1|\[?IPv6:::1\]?)[^)]*\)\s+by\s+(\S+)/i);
        if (!m) return null;

        const [, helo, byHost] = m;
        const fromOrg = organizationalDomain(signals.fromDomain);
        if (organizationalDomain(helo) === fromOrg || organizationalDomain(byHost) === fromOrg) return null;

        return {
            triggered: true,
            score: 0.5,
            penalty: -5,
            name: this.name,
            reason: `The message was injected by a local process (HELO ${helo}) on ${byHost}, a host unrelated to ${fromOrg}, and failed sender checks at first receipt.`,
            metadata: { helo, injectionHost: byHost }
        };
    }
}
