import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { organizationalDomain } from "../../analysis/Domain";

/**
 * Callback phishing (TOAD): a fake invoice, renewal or refund notice with a phone number
 * and few or no links. The victim calls, and a scripted (increasingly AI-voiced) "agent"
 * talks them into remote access or a payment. Link scanners see nothing to block.
 */
export class CallbackPhishingDetector implements Detector {
    id = "callback-phishing";
    name = "Callback Phishing (TOAD)";
    description = "Detects billing/renewal/refund lures that push the reader to call a phone number.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['content'];

    // International or North American numbers, tolerating spaces, dots, dashes and brackets.
    private phone = /(?:\+\s?\d{1,3}[\s.-]?)?(?:\(\s?\d{3}\s?\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b|\+\s?\d{1,3}(?:[\s.-]?\d{2,4}){3,5}\b/g;
    private lure = /\b(?:invoice|receipt|order\s+(?:confirmation|#|number)|subscription|auto-?renew(?:al|ed)?|renewal|membership|charged|debited|billed|payment\s+(?:of|has\s+been)|transaction|refund|cancel(?:lation)?|dispute|unauthori[sz]ed\s+(?:purchase|charge|transaction)|purchase)\b/i;
    private callToAction = /\b(?:call|dial|phone|contact\s+(?:us|our|the)|reach\s+(?:us|our)|helpline|help\s?desk|toll[\s-]?free|customer\s+(?:care|support|service)|billing\s+(?:department|support|team))\b/i;
    private brands = /\b(?:norton|mcafee|geek\s?squad|best\s?buy|paypal|amazon|microsoft|apple|coinbase|binance|ebay|netflix|avast|kaspersky|lifelock|quickbooks|intuit|walmart)\b/i;

    detect(context: DetectionContext): DetectionResult | null {
        const { signals } = context;
        const text = `${signals.subject || ""} ${signals.visibleText || context.emailBody?.text || ""}`;
        if (text.length < 40) return null;

        const phones = [...new Set((text.match(this.phone) || []).map(p => p.trim()).filter(p => p.replace(/\D/g, "").length >= 10))];
        if (phones.length === 0) return null;
        if (!this.lure.test(text) || !this.callToAction.test(text)) return null;

        const senderOrg = signals.fromDomain ? organizationalDomain(signals.fromDomain) : "";
        const externalLinks = (signals.extractedUrls || []).filter(u => {
            try {
                return organizationalDomain(new URL(u).hostname) !== senderOrg;
            } catch {
                return false;
            }
        });
        // Real invoices link to a portal; TOAD keeps the phone as the only way out.
        if (externalLinks.length > 2) return null;

        const brand = text.match(this.brands)?.[0];
        const brandMismatch = !!brand && !senderOrg.includes(brand.toLowerCase().replace(/\s+/g, ""));
        const unverified = signals.dmarcResult !== "pass" || signals.dmarcBestGuess;

        // A DMARC-verified sender talking about its own brand is an ordinary receipt.
        const freeSender = /^(?:gmail|yahoo|hotmail|outlook|aol|icloud|proton(?:mail)?|gmx|mail|yandex)\./.test(signals.fromDomain || "");
        if (!unverified && !brandMismatch && !freeSender) return null;

        let penalty = -20;
        if (brandMismatch) penalty -= 10;
        if (unverified) penalty -= 5;

        return {
            triggered: true,
            score: penalty <= -30 ? 0.85 : 0.65,
            penalty,
            name: this.name,
            reason: `Billing/renewal/refund lure asks the reader to call ${phones[0]}${brandMismatch ? ` and mentions ${brand} although the sender is ${senderOrg || "unknown"}` : ""}, with few or no links. This is callback (TOAD) phishing; the call leads to remote-access or payment fraud.`,
            metadata: { phones: phones.slice(0, 3), brand, brandMismatch }
        };
    }
}
