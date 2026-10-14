import { brandOwningHost, brandsMentioned, findLookalike, isFreemail, isLureWordDomain, isMixedScriptHost, registrableDomain, toUnicodeHost } from "../lib/domain.ts";
import { ATTACK, finding } from "./rule.ts";
import type { Rule } from "./rule.ts";

const ADDRESS_IN_TEXT = /[a-z0-9._%+-]+@([a-z0-9-]+(?:\.[a-z0-9-]+)+)/i;
const DOMAIN_IN_TEXT = /\b((?:[a-z0-9-]+\.)+(?:com|net|org|io|co|gov|edu|us|uk|de|fr|info|biz|me|app))\b/i;

export const displayNameAddress: Rule = {
    meta: {
        id: "ID-001",
        title: "Display name shows a different address",
        category: "identity",
        severity: "critical",
        attack: [ATTACK.impersonation, ATTACK.masquerading],
        description:
            'The display name contains an e-mail address or domain that differs from the real sender, e.g. "security@paypal.com" <alerts@unrelated.xyz>. Many mail clients show only the display name.',
        falsePositives: "Some ticketing and forwarding systems put the original sender's address in the display name (\"jane@example.com via Helpdesk\").",
    },
    run(ctx) {
        const from = ctx.message.from;
        if (!from?.name || !ctx.fromOrg) return null;
        const m = ADDRESS_IN_TEXT.exec(from.name) ?? DOMAIN_IN_TEXT.exec(from.name);
        if (!m) return null;
        const shownDomain = m[1].toLowerCase();
        if (registrableDomain(shownDomain) === ctx.fromOrg) return null;
        // "via" relays are a known benign pattern; downgrade them.
        const via = /\bvia\b/i.test(from.name);
        const shownBrand = brandOwningHost(shownDomain);
        const severity = via ? "low" : shownBrand ? "critical" : "high";
        return finding(this.meta, severity, `The display name claims ${shownDomain}, but the message was sent from ${ctx.fromDomain}.`, [
            { label: "Display name", value: from.name },
            { label: "Actual address", value: from.address },
        ]);
    },
};

export const brandDisplayName: Rule = {
    meta: {
        id: "ID-002",
        title: "Brand named in display name, sent from elsewhere",
        category: "identity",
        severity: "high",
        attack: [ATTACK.impersonation],
        description:
            "The display name names a well-known brand (Microsoft, PayPal, DocuSign, ...) but the address belongs to a domain that brand does not own.",
        falsePositives: "Resellers, partners and platforms that legitimately mention a brand (\"Acme via DocuSign\" sent from a customer domain).",
    },
    run(ctx) {
        const from = ctx.message.from;
        if (!from?.name || !ctx.fromDomain) return null;
        const brands = brandsMentioned(from.name);
        if (brands.length === 0) return null;
        const owner = brandOwningHost(ctx.fromDomain);
        const impersonated = brands.filter((b) => b !== owner);
        if (impersonated.length === 0) return null;
        const brand = impersonated[0];
        const freemail = isFreemail(ctx.fromDomain);
        return finding(
            this.meta,
            freemail ? "critical" : "high",
            `The display name invokes ${brand.name}, but the sender ${ctx.fromDomain} ${freemail ? "is a free webmail address" : `is not a ${brand.name} domain`}.`,
            [
                { label: "Display name", value: from.name },
                { label: "Sender domain", value: ctx.fromDomain },
                { label: `${brand.name} domains`, value: brand.domains.slice(0, 4).join(", ") },
            ],
        );
    },
};

export const lookalikeSender: Rule = {
    meta: {
        id: "ID-003",
        title: "Lookalike sender domain",
        category: "identity",
        severity: "critical",
        attack: [ATTACK.impersonation, ATTACK.lookalikeDomain],
        description:
            "The sender's domain imitates a well-known brand: a homograph using look-alike characters, a typo (paypa1.com), or the brand plus a lure word (microsoft-support.net).",
        falsePositives: "Unrelated companies whose names are one letter away from a brand. Edit-distance matches are reported at lower severity than character tricks.",
    },
    run(ctx) {
        if (!ctx.fromDomain) return null;
        const hit = findLookalike(ctx.fromDomain);
        if (!hit) return null;
        const how = {
            homograph: "uses characters from another alphabet to look like",
            typosquat: hit.confidence === "high" ? "swaps characters to look like" : "is a near-misspelling of",
            combosquat: "combines the brand name with a lure word to look like",
        }[hit.kind];
        return finding(this.meta, hit.confidence === "high" ? "critical" : "high", `The sender domain ${hit.displayHost} ${how} ${hit.target} (${hit.brand.name}).`, [
            { label: "Sender domain", value: hit.displayHost === ctx.fromDomain ? ctx.fromDomain : `${hit.displayHost} (${ctx.fromDomain})` },
            { label: "Imitates", value: hit.target },
            { label: "Technique", value: hit.kind },
        ]);
    },
};

export const mixedScriptSender: Rule = {
    meta: {
        id: "ID-004",
        title: "Sender domain mixes alphabets",
        category: "identity",
        severity: "high",
        attack: [ATTACK.impersonation, ATTACK.lookalikeDomain],
        description: "A label of the sender's domain mixes Latin with Cyrillic, Greek or Armenian letters, a hallmark of homograph attacks.",
        falsePositives: "Very rare in legitimate domains.",
    },
    run(ctx) {
        if (!ctx.fromDomain || findLookalike(ctx.fromDomain)) return null;
        if (!isMixedScriptHost(ctx.fromDomain)) return null;
        return finding(this.meta, "high", `The sender domain ${toUnicodeHost(ctx.fromDomain)} mixes letters from different alphabets.`, [
            { label: "Sender domain", value: `${toUnicodeHost(ctx.fromDomain)} (${ctx.fromDomain})` },
        ]);
    },
};

export const replyToMismatch: Rule = {
    meta: {
        id: "ID-005",
        title: "Replies go to a different organization",
        category: "identity",
        severity: "high",
        attack: [ATTACK.impersonation],
        description:
            "The Reply-To address belongs to a different organization than the From address, so a reply goes somewhere the visible sender does not control. Common in business e-mail compromise.",
        falsePositives: "Newsletters and support systems that route replies to a helpdesk domain, and mailing lists (List-Id present).",
    },
    run(ctx) {
        if (!ctx.fromOrg || ctx.replyToDomains.length === 0) return null;
        const foreign = ctx.message.replyTo.filter((r) => {
            const org = registrableDomain(r.address.split("@")[1] ?? "");
            return org && org !== ctx.fromOrg;
        });
        if (foreign.length === 0) return null;
        if (ctx.message.listId) return null;
        const target = foreign[0];
        const targetDomain = target.address.split("@")[1] ?? "";
        const toFreemail = isFreemail(targetDomain);
        const toLureDomain = isLureWordDomain(targetDomain);
        // Free-mail to free-mail with a different mailbox is still a BEC pattern, but weaker.
        const severity = (toFreemail && !ctx.freemailSender) || toLureDomain ? "high" : "medium";
        return finding(this.meta, severity, `Replies would go to ${target.address}${toFreemail ? ", a free webmail address," : ""} instead of ${ctx.fromDomain}.`, [
            { label: "From", value: ctx.message.from?.address ?? "" },
            ...foreign.map((r) => ({ label: "Reply-To", value: r.address })),
        ]);
    },
};

export const lureWordSender: Rule = {
    meta: {
        id: "ID-006",
        title: "Sender domain named with lure words",
        category: "identity",
        severity: "medium",
        attack: [ATTACK.impersonation, ATTACK.lookalikeDomain],
        description: "The sender's domain is made almost entirely of words like secure, account, verify or support (account-verify-center.xyz), a naming pattern used to look official without naming a brand.",
        falsePositives: "Small businesses with generic names such as support-services.example.",
    },
    run(ctx) {
        if (!ctx.fromDomain || !isLureWordDomain(ctx.fromDomain) || findLookalike(ctx.fromDomain)) return null;
        return finding(this.meta, "medium", `The sender domain ${ctx.fromOrg} is named only with security and account vocabulary.`, [{ label: "Sender domain", value: ctx.fromDomain }]);
    },
};

const INTERNAL_FUNCTION = /\b(hr|human resources|payroll|benefits|it support|it help ?desk|it department|it service ?desk|it team|help ?desk|service ?desk|tech support|system administrator|sysadmin|administrator|mail ?box (admin|team|support)|e-?mail (admin|team|support)|webmaster|postmaster|accounts payable|finance department|security team|it security)\b/i;

export const externalInternalRole: Rule = {
    meta: {
        id: "ID-007",
        title: "Internal department name from outside the organization",
        category: "identity",
        severity: "medium",
        attack: [ATTACK.impersonation],
        description:
            "The display name presents the sender as an internal team (HR, Payroll, IT Support, Helpdesk, Administrator) but the address belongs to an organization none of the recipients are in.",
        falsePositives: "Outsourced HR, payroll or IT providers writing from their own domain.",
    },
    run(ctx) {
        const name = ctx.message.from?.name;
        if (!name || !ctx.fromOrg || !INTERNAL_FUNCTION.test(name)) return null;
        const recipients = [...ctx.message.to, ...ctx.message.cc].map((r) => registrableDomain(r.address.split("@")[1] ?? "")).filter((d): d is string => !!d);
        if (recipients.length === 0 || recipients.includes(ctx.fromOrg)) return null;
        // A well-known brand's own security or support team is not an internal role.
        if (brandOwningHost(ctx.fromDomain)) return null;
        const role = INTERNAL_FUNCTION.exec(name)?.[0] ?? name;
        return finding(this.meta, ctx.freemailSender ? "high" : "medium", `The sender calls itself "${role}" but writes from ${ctx.fromOrg}, outside the recipient's organization (${recipients[0]}).`, [
            { label: "Display name", value: name },
            { label: "Sender domain", value: ctx.fromDomain ?? "" },
            { label: "Recipient domain", value: recipients[0] },
        ]);
    },
};

export const identityRules: Rule[] = [displayNameAddress, brandDisplayName, lookalikeSender, mixedScriptSender, replyToMismatch, lureWordSender, externalInternalRole];
