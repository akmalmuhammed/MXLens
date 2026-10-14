import type { Context } from "../context.ts";
import { senderAuthenticated } from "../context.ts";
import { brandOwningHost, brandsMentioned } from "../lib/domain.ts";
import { truncate } from "../lib/text.ts";
import { ATTACK, finding } from "./rule.ts";
import type { Rule } from "./rule.ts";

/** Returns the distinct phrases from `patterns` found in `text`. */
function matches(text: string, patterns: RegExp[]): string[] {
    const found: string[] = [];
    for (const re of patterns) {
        const m = re.exec(text);
        if (m) found.push(m[0].trim().replace(/\s+/g, " "));
    }
    return [...new Set(found.map((f) => f.toLowerCase()))];
}

const PRESSURE = [
    /\b(urgent(ly)?|immediately|right away|as soon as possible|asap)\b/i,
    /\bwithin (24|48|72|twenty-four) hours\b/i,
    /\b(expires?|expiring|expired) (today|soon|in \d+)/i,
    /\b(account|mailbox|access|service)\s+(will|may|has been|is)\s+(be\s+)?(suspended|closed|locked|disabled|deleted|terminated|restricted|deactivated)/i,
    /\b(final|last) (notice|warning|reminder)\b/i,
    /\bfailure to (comply|respond|verify|update|act)\b/i,
    /\bunusual (sign-?in|login|activity)\b/i,
    /\b(action|response) required\b/i,
    /\bbefore \d{1,2}(:\d{2})?\s?(am|pm)\b/i,
    /\b(avoid|prevent) (suspension|closure|deactivation|termination|interruption|being locked|losing access)\b/i,
    /\b(suspension|deactivation|termination|closure) of your\b/i,
    /\b(failed|declined|on hold|could not be (processed|delivered|verified))\b/i,
];

const CREDENTIAL_ASK = [
    /\b(verify|confirm|validate|update|re-?activate|unlock)\s+(your\s+)?(account|identity|password|credentials|details|information|mailbox|login)\b/i,
    /\b(sign|log) ?in (now|here|below|to (avoid|keep|restore|confirm))/i,
    /\b(enter|provide|re-?enter)\s+(your\s+)?(password|credentials|login|pin|card)/i,
    /\bpassword (will )?expir/i,
    /\b(update|fix|confirm|verify|re-?enter)\s+(your\s+)?(payroll|direct deposit|bank(ing)?|payment|billing|card|shipping address)(\s+(details|information|info|method))?\b/i,
    /\bverify (now|here|below|immediately)\b/i,
];

export const pressureLanguage: Rule = {
    meta: {
        id: "CONTENT-001",
        title: "Pressure and credential request",
        category: "content",
        severity: "medium",
        attack: [ATTACK.phishing],
        description:
            "The text combines urgency or threats (account suspension, short deadlines) with a request to sign in or confirm details. English only.",
        falsePositives: "Genuine security notices and password-expiry reminders, which is why this rule alone never makes a message malicious.",
    },
    run(ctx) {
        if (!ctx.text || !ctx.english) return null;
        const pressure = matches(ctx.text, PRESSURE);
        const credential = matches(ctx.text, CREDENTIAL_ASK);
        if (credential.length === 0 || pressure.length === 0) {
            if (pressure.length >= 3) {
                return finding(this.meta, "low", "The message leans heavily on urgency and threats.", pressure.map((p) => ({ label: "Phrase", value: p })), 6);
            }
            return null;
        }
        const severity = senderAuthenticated(ctx) && !ctx.freemailSender ? "low" : "medium";
        return finding(this.meta, severity, "The message pressures the reader to act quickly and asks them to sign in or confirm details.", [
            ...pressure.map((p) => ({ label: "Pressure", value: p })),
            ...credential.map((p) => ({ label: "Request", value: p })),
        ], severity === "low" ? 6 : 18);
    },
};

const PAYMENT_CHANGE = [
    /\b(new|updated|changed?|different)\s+(bank(ing)?|account|remittance|payment|wire)\s+(details|information|info|instructions)\b/i,
    /\bchange (of|in|to) (our )?(bank(ing)?|account|payment) (details|information)\b/i,
    /\b(our|the) (bank|account) (has )?(changed|been updated)\b/i,
    /\b(wire|transfer|remit)\b.{0,60}\b(new|different|updated) account\b/i,
];

const GIFT_CARD = [/\b(gift ?cards?|itunes cards?|google play cards?|steam cards?)\b/i];
const GIFT_ASK = [/\b(buy|purchase|get|pick up|send|scratch)\b/i];
const EXEC_ASK = [/\b(are you (available|around|at your desk)|quick (favou?r|task)|i need you to|keep (this|it) (confidential|between us)|i'?m in a meeting)\b/i];

export const paymentFraud: Rule = {
    meta: {
        id: "CONTENT-002",
        title: "Payment or gift-card request",
        category: "content",
        severity: "high",
        attack: [ATTACK.phishing, ATTACK.impersonation],
        description:
            "The message asks to change bank or payment details, or to buy gift cards: the core moves of business e-mail compromise. English only.",
        falsePositives: "Genuine supplier bank-detail changes, which should always be confirmed by phone using a known number.",
    },
    run(ctx) {
        if (!ctx.text || !ctx.english) return null;
        const payment = matches(ctx.text, PAYMENT_CHANGE);
        const gift = matches(ctx.text, GIFT_CARD).length > 0 && matches(ctx.text, GIFT_ASK).length > 0 ? matches(ctx.text, GIFT_CARD) : [];
        const exec = matches(ctx.text, EXEC_ASK);
        if (payment.length === 0 && gift.length === 0) return null;
        const severity = gift.length || !senderAuthenticated(ctx) || ctx.freemailSender ? "high" : "medium";
        return finding(this.meta, severity, gift.length ? "The message asks the reader to buy gift cards." : "The message asks to send money to new or changed bank details.", [
            ...payment.map((p) => ({ label: "Payment request", value: p })),
            ...gift.map((p) => ({ label: "Gift cards", value: p })),
            ...exec.map((p) => ({ label: "Pretext", value: p })),
        ]);
    },
};

const PHONE = /(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b|\+\d{1,3}[\s.-]?\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}/;
const BILLING = /\b(invoice|order|renewal|renewed|subscription|charged|auto-?renew|refund|purchase|transaction|membership)\b/i;
const CANCEL = /\b(cancel|dispute|refund|not (you|authorized)|call (us|our|the)|contact (us|our|support))\b/i;

export const callbackScam: Rule = {
    meta: {
        id: "CONTENT-003",
        title: "Call-back scam pattern",
        category: "content",
        severity: "high",
        attack: [ATTACK.voice, ATTACK.impersonation],
        description:
            "A billing or renewal notice with no real links that asks the reader to phone a number to cancel or dispute a charge. The call leads to a fake support agent.",
        falsePositives: "Genuine order confirmations that list a support phone number; those usually come from an authenticated brand domain with links.",
    },
    run(ctx) {
        if (!ctx.text || !ctx.english) return null;
        const phone = PHONE.exec(ctx.text);
        if (!phone || !BILLING.test(ctx.text) || !CANCEL.test(ctx.text)) return null;
        const realLinks = ctx.links.filter((l) => l.host && l.source !== "form").length;
        if (realLinks > 2) return null;
        const brands = brandsMentioned(ctx.text).filter((b) => b !== brandOwningHost(ctx.fromDomain));
        if (senderAuthenticated(ctx) && brands.length === 0 && !ctx.freemailSender) return null;
        const severity = brands.length > 0 || ctx.freemailSender ? "high" : "medium";
        return finding(this.meta, severity, `The message asks the reader to call ${phone[0].trim()} about a charge${brands[0] ? ` while claiming to be ${brands[0].name}` : ""}.`, [
            { label: "Phone number", value: phone[0].trim() },
            ...(brands[0] ? [{ label: "Claims to be", value: brands[0].name }] : []),
            { label: "Sender", value: ctx.message.from?.address ?? "unknown" },
        ]);
    },
};

export const hiddenText: Rule = {
    meta: {
        id: "CONTENT-004",
        title: "Large amount of hidden text",
        category: "content",
        severity: "low",
        attack: [ATTACK.obfuscation],
        description: "The HTML hides a large block of text with CSS (display:none, zero font size). Attackers pad messages with invisible text to confuse filters.",
        falsePositives: "Newsletters hide short preview text; only blocks over 300 characters are reported.",
    },
    run(ctx) {
        if (ctx.hiddenTextChars < 300) return null;
        return finding(this.meta, ctx.hiddenTextChars > 1000 ? "medium" : "low", `About ${ctx.hiddenTextChars} characters of text are hidden from the reader.`, [{ label: "Hidden characters", value: String(ctx.hiddenTextChars) }], 10);
    },
};

export function bodyExcerpt(ctx: Context): string {
    return truncate(ctx.text.replace(/\s+/g, " ").trim(), 200);
}

export const contentRules: Rule[] = [pressureLanguage, paymentFraud, callbackScam, hiddenText];
