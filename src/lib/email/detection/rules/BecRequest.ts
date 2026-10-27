import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { FREE_PROVIDERS, HIGH_VALUE_ROLES } from "../../scoring/Config";
import { organizationalDomain } from "../../analysis/Domain";

/**
 * Business email compromise has no link or attachment to scan. Microsoft Q1 2026: most BEC
 * starts with a generic conversational opener ("are you available?"), followed by payroll
 * diversion, vendor bank-detail changes or gift-card requests.
 */
export class BecRequestDetector implements Detector {
    id = "bec-request";
    name = "BEC Request";
    description = "Detects payroll diversion, bank-detail change and gift-card requests, and conversational openers from unverifiable senders.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['content'];

    private requests: { id: string; label: string; re: RegExp; penalty: number }[] = [
        { id: "gift-card", label: "gift card purchase request", penalty: -25, re: /\b(?:buy|purchase|get|pick\s+up|send)\b[\s\S]{0,80}\bgift\s?cards?\b|\bgift\s?cards?\b[\s\S]{0,120}\b(?:scratch|codes?|pictures?|photos?)\b/i },
        { id: "payroll", label: "payroll / direct-deposit change", penalty: -25, re: /\b(?:change|update|switch|new)\b[\s\S]{0,60}\b(?:direct\s+deposit|payroll|salary)\b[\s\S]{0,80}\b(?:account|bank|details|info(?:rmation)?)\b|\b(?:direct\s+deposit|payroll)\b[\s\S]{0,60}\b(?:change|update)\b/i },
        { id: "bank-change", label: "bank-detail change for payments", penalty: -25, re: /\b(?:our|the|my)\s+(?:bank(?:ing)?\s+(?:details|account|information)|account\s+details|remittance\s+details)\s+(?:have|has)\s+(?:been\s+)?(?:changed|updated)|\b(?:new|updated)\s+(?:bank(?:ing)?|remittance|wire)\s+(?:details|account|instructions)\b|\bchange\s+of\s+bank(?:ing)?\s+details\b/i },
        { id: "wire", label: "urgent wire / transfer request", penalty: -15, re: /\b(?:process|make|send|initiate|arrange|complete)\b[\s\S]{0,40}\b(?:wire|transfer|payment)\b[\s\S]{0,60}\b(?:today|urgently|asap|right\s+away|immediately|before\s+(?:noon|eod|end\s+of\s+(?:the\s+)?day))\b/i }
    ];
    private opener = /^\s*(?:hi|hello|hey|dear\s+\w+)?[\s,!]*(?:are\s+you\s+(?:available|around|at\s+your\s+desk|free)|do\s+you\s+have\s+a\s+(?:moment|minute|sec)|i\s+need\s+(?:a\s+(?:quick\s+)?favou?r|you\s+to\s+handle)|quick\s+(?:task|favou?r|question)|send\s+me\s+your\s+(?:cell|mobile|whatsapp)(?:\s+number)?)/i;

    detect(context: DetectionContext): DetectionResult | null {
        const { signals } = context;
        const text = `${signals.subject || ""}\n${signals.visibleText || context.emailBody?.text || ""}`;
        const fromOrg = signals.fromDomain ? organizationalDomain(signals.fromDomain) : "";
        const replyOrg = signals.replyToDomain ? organizationalDomain(signals.replyToDomain) : "";
        const freeSender = FREE_PROVIDERS.includes(signals.fromDomain);
        const replyDiverted = !!replyOrg && replyOrg !== fromOrg;
        const unverified = signals.dmarcResult !== "pass" || signals.dmarcBestGuess;
        const execName = HIGH_VALUE_ROLES.some(r => new RegExp(`\\b${r}\\b`, "i").test(signals.fromDisplayName));
        const riskContext = freeSender || replyDiverted || unverified;

        const hit = this.requests.find(r => r.re.test(text));
        if (hit && riskContext) {
            const extra = [freeSender ? "free-mail sender" : "", replyDiverted ? `replies diverted to ${replyOrg}` : "", unverified && !freeSender ? "sender not DMARC-verified" : "", execName ? "executive/finance display name" : ""].filter(Boolean);
            return {
                triggered: true,
                score: 0.8,
                penalty: hit.penalty - (extra.length >= 2 ? 10 : 0),
                name: this.name,
                reason: `Business email compromise pattern: ${hit.label}${extra.length ? ` (${extra.join(", ")})` : ""}. Verify by phone using a known number before acting.`,
                metadata: { request: hit.id, extra }
            };
        }

        const body = signals.visibleText || context.emailBody?.text || "";
        if (this.opener.test(body.slice(0, 200)) && body.length < 600 && (freeSender || replyDiverted) && (execName || replyDiverted)) {
            return {
                triggered: true,
                score: 0.5,
                penalty: -10,
                name: this.name,
                reason: "Short conversational opener (\"are you available?\") from a free-mail or reply-diverted sender, the usual first step of a BEC conversation.",
                metadata: { request: "opener" }
            };
        }
        return null;
    }
}
