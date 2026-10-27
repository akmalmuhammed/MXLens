import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { organizationalDomain } from "../../analysis/Domain";
import { envelopeRecipients, visibleRecipients } from "../../analysis/Recipients";

const PLATFORM_SENDERS = [
    "google.com", "microsoft.com", "microsoftonline.com", "sharepointonline.com", "office.com", "apple.com",
    "paypal.com", "docusign.net", "docusign.com", "dropbox.com", "adobe.com", "adobesign.com", "intuit.com",
    "zoom.us", "github.com", "salesforce.com", "amazon.com", "facebookmail.com", "linkedin.com"
];

/**
 * Abuse of genuine platform notifications. The message really was signed by Google,
 * PayPal, DocuSign, ... so SPF/DKIM/DMARC pass, but the attacker controls part of the content
 * (an app name, an invoice note, a shared-file title) and then re-sends ("replays") it to
 * victims. Tell-tales: the signed To: address is not the recipient, and the notification
 * carries a phone number or a link to user-generated hosting.
 */
export class NotificationAbuseDetector implements Detector {
    id = "notification-abuse";
    name = "Platform Notification Abuse / DKIM Replay";
    description = "Detects genuine platform notifications re-sent to other recipients or carrying attacker-controlled contact details.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['auth', 'content'];

    private phone = /(?:\+\s?\d{1,3}[\s.-]?)?(?:\(\s?\d{3}\s?\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/;
    private userContentHosts = /(?:^|\.)(?:sites\.google\.com|docs\.google\.com|forms\.gle|forms\.office\.com|storage\.googleapis\.com|firebasestorage\.googleapis\.com|web\.app|pages\.dev|workers\.dev|vercel\.app|netlify\.app|github\.io|notion\.site|canva\.site)$/i;

    detect(context: DetectionContext): DetectionResult | null {
        const { signals, header } = context;
        const fromOrg = signals.fromDomain ? organizationalDomain(signals.fromDomain) : "";
        if (!PLATFORM_SENDERS.includes(fromOrg)) return null;
        // Only meaningful when the platform's signature verified; otherwise other rules apply.
        if (signals.dkimResult !== "pass" && !(header.originAuth?.dkim === "pass")) return null;

        const reasons: string[] = [];
        let penalty = 0;

        const delivered = envelopeRecipients(header.headers);
        const visible = visibleRecipients(header.headers);
        if (delivered.length > 0 && visible.length > 0 && !delivered.some(d => visible.includes(d))) {
            const visibleOrgs = new Set(visible.map(v => organizationalDomain(v.split("@")[1])));
            if (!delivered.some(d => visibleOrgs.has(organizationalDomain(d.split("@")[1])))) {
                penalty -= 20;
                reasons.push(`it was signed for ${visible[0]} but delivered to ${delivered[0]}, which is how DKIM replay reuses a genuine signature`);
            }
        }

        const text = signals.visibleText || context.emailBody?.text || "";
        // Billing context only: calendar and meeting notifications carry dial-in numbers.
        if (this.phone.test(text) && /\b(?:call|contact)\b/i.test(text)
            && /\b(?:invoice|payment|charged|refund|dispute|order|subscription|transaction|purchase|billing)\b/i.test(text)) {
            penalty -= 15;
            reasons.push("the notification text carries a phone number to call, a common way to inject callback-scam details into a genuine invoice/notification");
        }

        const ugc = (signals.extractedUrls || []).map(u => {
            try {
                return new URL(u).hostname;
            } catch {
                return "";
            }
        }).find(h => h && this.userContentHosts.test(h));
        if (ugc) {
            penalty -= 10;
            reasons.push(`it links to user-generated content on ${ugc}`);
        }

        if (penalty === 0) return null;
        return {
            triggered: true,
            score: penalty <= -25 ? 0.8 : 0.55,
            penalty: Math.max(penalty, -35),
            name: this.name,
            reason: `Genuine ${fromOrg} notification, but ${reasons.join("; and ")}. Passing authentication does not vouch for attacker-supplied content.`,
            metadata: { fromOrg, delivered, visible }
        };
    }
}
