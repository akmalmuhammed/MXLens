import { Detector, DetectionContext, DetectionResult } from "../Detector";

export class ReplyToMismatchDetector implements Detector {
    id = "reply-to-mismatch";
    name = "Reply-To Mismatch";
    description = "Detects when the Reply-To address is suspicious compared to the From address.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['identity'];

    private freeProviders = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com"];

    detect(context: DetectionContext): DetectionResult | null {
        const fromDomain = context.signals.fromDomain.toLowerCase();
        const replyToDomain = context.signals.replyToDomain?.toLowerCase();

        if (!replyToDomain || fromDomain === replyToDomain) return null;

        // Case 1: Corporate From -> Free Reply-To
        // E.g. CEO@microsoft.com -> hacker@gmail.com
        const isFromCorporate = !this.freeProviders.includes(fromDomain);
        const isReplyToFree = this.freeProviders.includes(replyToDomain);

        if (isFromCorporate && isReplyToFree) {
            return {
                triggered: true,
                score: 0.85,
                penalty: -20,
                name: this.name,
                reason: `Suspicious Mismatch: Corporate sender (${fromDomain}) replies to free provider (${replyToDomain})`,
                metadata: { from: fromDomain, replyTo: replyToDomain }
            };
        }

        // Case 2: Complete Domain Mismatch (weak signal, standard for newsletters, so lower penalty)
        if (isFromCorporate && !context.signals.brandInBody) {
            // If it's a newsletter (BrandInBody usually present), we ignore. 
            // But for raw corporate email, different Reply-To is odd.
            return {
                triggered: true,
                score: 0.3,
                penalty: -5,
                name: "External Reply-To",
                reason: `Reply-To domain (${replyToDomain}) does not match Sender domain (${fromDomain})`,
            }
        }

        return null;
    }
}
