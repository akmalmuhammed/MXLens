import type { Context } from "../context.ts";
import { senderAuthenticated } from "../context.ts";
import type { Link } from "../types.ts";
import { brandInHostLabels, brandOwningHost, findLookalike, isIpLiteral, isLureWordDomain, registrableDomain } from "../lib/domain.ts";
import { redirectTarget, makeLink } from "../parse/links.ts";
import { truncate } from "../lib/text.ts";
import { SHORTENERS } from "../data/lists.ts";
import { ATTACK, finding } from "./rule.ts";
import type { Rule } from "./rule.ts";

function mark(link: Link, ruleId: string): void {
    if (!link.flags.includes(ruleId)) link.flags.push(ruleId);
}

/**
 * Adds destinations hidden inside redirect parameters (google.com/url?q=...) to
 * the context's links, once, so every rule sees and can flag them.
 */
export function addRedirectTargets(ctx: Context): void {
    for (const l of [...ctx.links]) {
        const target = redirectTarget(l.url);
        const inner = target ? makeLink(target, "redirect", l.text) : null;
        if (inner && !ctx.links.some((x) => x.url === inner.url)) ctx.links.push(inner);
    }
}

const URLISH_TEXT = /^(?:https?:\/\/)?(?:www\.)?((?:[a-z0-9-]+\.)+[a-z]{2,})(?:[/:?#][^\s]*)?$/i;

export const linkTextMismatch: Rule = {
    meta: {
        id: "LINK-001",
        title: "Link text shows a different destination",
        category: "links",
        severity: "high",
        attack: [ATTACK.link, ATTACK.maliciousLink],
        description: "A link's visible text is a web address, but the link actually goes to a different organization's domain.",
        falsePositives: "Marketing click-tracking, where text shows the brand's site but the link passes through an e-mail service provider. Reported at low severity when the sender is authenticated.",
    },
    run(ctx) {
        const hits: { link: Link; shown: string }[] = [];
        for (const link of ctx.links) {
            if (!link.text || !link.domain || link.source !== "html") continue;
            const m = URLISH_TEXT.exec(link.text.trim());
            if (!m) continue;
            const shownOrg = registrableDomain(m[1]);
            if (!shownOrg || shownOrg === link.domain) continue;
            // Click-tracking that unwraps to the shown domain is not deceptive.
            const target = redirectTarget(link.url);
            if (target && registrableDomain(new URL(target).hostname) === shownOrg) continue;
            hits.push({ link, shown: m[1].toLowerCase() });
        }
        if (hits.length === 0) return null;
        hits.forEach((h) => mark(h.link, this.meta.id));
        const brandShown = hits.find((h) => brandOwningHost(h.shown) && !brandOwningHost(h.link.host));
        const severity = brandShown ? "critical" : senderAuthenticated(ctx) ? "low" : "high";
        const first = brandShown ?? hits[0];
        return finding(this.meta, severity, `A link displays ${first.shown} but leads to ${first.link.domain}.`, hits.map((h) => ({
            label: "Link",
            value: truncate(h.link.url),
            note: `text shows ${h.shown}`,
        })));
    },
};

export const ipAddressLink: Rule = {
    meta: {
        id: "LINK-002",
        title: "Link to a raw IP address",
        category: "links",
        severity: "high",
        attack: [ATTACK.link, ATTACK.maliciousLink],
        description: "A link points to a bare IP address (including decimal or hex forms) instead of a domain name. Legitimate senders almost never do this.",
        falsePositives: "Internal tools and network equipment notifications that link to device IPs.",
    },
    run(ctx) {
        const hits = ctx.links.filter((l) => l.host && isIpLiteral(l.host));
        if (hits.length === 0) return null;
        hits.forEach((l) => mark(l, this.meta.id));
        return finding(this.meta, "high", `${hits.length === 1 ? "A link points" : `${hits.length} links point`} to a raw IP address (${hits[0].host}).`, hits.map((l) => ({ label: "Link", value: truncate(l.url) })));
    },
};

export const urlShortener: Rule = {
    meta: {
        id: "LINK-003",
        title: "Shortened link hides the destination",
        category: "links",
        severity: "low",
        attack: [ATTACK.link],
        description: "A link uses a URL shortener, so the real destination is not visible until clicked.",
        falsePositives: "Common in newsletters and social media notifications. First-party shorteners (lnkd.in from LinkedIn, aka.ms from Microsoft) are ignored when the sender is that brand.",
    },
    run(ctx) {
        const hits = ctx.links.filter((l) => {
            if (!l.host) return false;
            const owner = SHORTENERS.get(l.host) ?? SHORTENERS.get(l.domain ?? "");
            if (owner === undefined) return false;
            return owner === null || owner !== ctx.senderBrand;
        });
        if (hits.length === 0) return null;
        hits.forEach((l) => mark(l, this.meta.id));
        return finding(this.meta, "low", `${hits.length} link${hits.length > 1 ? "s use" : " uses"} a URL shortener (${hits[0].host}).`, hits.map((l) => ({ label: "Link", value: truncate(l.url) })), 10);
    },
};

export const brandDeceptiveHost: Rule = {
    meta: {
        id: "LINK-004",
        title: "Brand name used as a decoy in a link",
        category: "links",
        severity: "critical",
        attack: [ATTACK.link, ATTACK.impersonation],
        description: "A link's hostname contains a brand's name or domain as a subdomain (paypal.com.account-check.net), but the real, registrable domain belongs to someone else.",
        falsePositives: "Rare: some partners host brand-named subdomains (paypal.partner.example.com).",
    },
    run(ctx) {
        const hits: { link: Link; brand: string; label: string }[] = [];
        for (const link of ctx.links) {
            const hit = brandInHostLabels(link.host);
            if (hit) hits.push({ link, brand: hit.brand.name, label: hit.label });
        }
        if (hits.length === 0) return null;
        hits.forEach((h) => mark(h.link, this.meta.id));
        const h = hits[0];
        return finding(this.meta, "critical", `A link to ${h.link.host} uses "${h.label}" as a decoy; the real domain is ${h.link.domain}, which ${h.brand} does not own.`, hits.map((x) => ({ label: "Link", value: truncate(x.link.url) })));
    },
};

export const lookalikeLink: Rule = {
    meta: {
        id: "LINK-005",
        title: "Link to a lookalike domain",
        category: "links",
        severity: "critical",
        attack: [ATTACK.link, ATTACK.lookalikeDomain],
        description: "A link goes to a domain that imitates a well-known brand through a typo, look-alike characters or added lure words.",
        falsePositives: "Unrelated sites whose names are one letter away from a brand (reported at lower severity).",
    },
    run(ctx) {
        const hits: { link: Link; target: string; kind: string; high: boolean }[] = [];
        for (const link of ctx.links) {
            const hit = findLookalike(link.host);
            if (hit) hits.push({ link, target: hit.target, kind: hit.kind, high: hit.confidence === "high" });
        }
        if (hits.length === 0) return null;
        hits.forEach((h) => mark(h.link, this.meta.id));
        const best = hits.find((h) => h.high) ?? hits[0];
        return finding(this.meta, best.high ? "critical" : "high", `A link goes to ${best.link.host}, a ${best.kind} of ${best.target}.`, hits.map((h) => ({ label: "Link", value: truncate(h.link.url), note: `${h.kind} of ${h.target}` })));
    },
};

export const openRedirect: Rule = {
    meta: {
        id: "LINK-006",
        title: "Link bounces through a redirect",
        category: "links",
        severity: "medium",
        attack: [ATTACK.link, ATTACK.obfuscation],
        description: "A link passes through a trusted site's redirect (google.com/url?q=...) to an unrelated destination, borrowing the trusted domain's reputation.",
        falsePositives: "E-mail click-tracking that redirects to the sender's own site is ignored.",
    },
    run(ctx) {
        const hits: { link: Link; target: string; targetDomain: string }[] = [];
        for (const link of ctx.links) {
            const target = redirectTarget(link.url);
            if (!target) continue;
            const targetDomain = registrableDomain(new URL(target).hostname);
            if (!targetDomain || targetDomain === link.domain) continue;
            const outerBrand = brandOwningHost(link.host);
            // Click-tracking through an e-mail provider back to the sender's own site is normal.
            if (!outerBrand && targetDomain === ctx.fromOrg) continue;
            if (ctx.senderBrand && brandOwningHost(targetDomain)?.name === ctx.senderBrand) continue;
            if (outerBrand && brandOwningHost(targetDomain) === outerBrand) continue;
            hits.push({ link, target, targetDomain });
        }
        if (hits.length === 0) return null;
        hits.forEach((h) => mark(h.link, this.meta.id));
        const h = hits[0];
        return finding(this.meta, brandOwningHost(h.link.host) ? "medium" : "low", `A link on ${h.link.host} redirects to ${h.targetDomain}.`, hits.map((x) => ({ label: "Link", value: truncate(x.link.url), note: `goes to ${truncate(x.target, 90)}` })));
    },
};

export const credentialForm: Rule = {
    meta: {
        id: "LINK-007",
        title: "Login form inside the e-mail",
        category: "links",
        severity: "critical",
        attack: [ATTACK.credentials, ATTACK.link],
        description: "The HTML body contains a form with a password field or a form that submits to a website. Legitimate services do not collect credentials inside an e-mail.",
        falsePositives: "Surveys embedded in e-mail (no password field) are reported at lower severity.",
    },
    run(ctx) {
        if (!ctx.html || !/<form\b/i.test(ctx.html)) return null;
        const password = /<input\b[^>]*type\s*=\s*["']?password/i.test(ctx.html);
        const action = ctx.links.find((l) => l.source === "form");
        if (action) mark(action, this.meta.id);
        return finding(
            this.meta,
            password ? "critical" : "medium",
            password ? "The e-mail contains a form asking for a password." : `The e-mail contains a form that submits to ${action?.host ?? "a website"}.`,
            [
                ...(password ? [{ label: "Field", value: "password input" }] : []),
                ...(action ? [{ label: "Submits to", value: truncate(action.url) }] : []),
            ],
        );
    },
};

export const scriptUri: Rule = {
    meta: {
        id: "LINK-008",
        title: "Link runs code or embeds a page",
        category: "links",
        severity: "high",
        attack: [ATTACK.link, ATTACK.smuggling],
        description: "A link uses a data: or javascript: URI, which can render a hidden phishing page or run script without visiting a website.",
        falsePositives: "Almost none in e-mail.",
    },
    run(ctx) {
        const hits = ctx.links.filter((l) => l.host === null);
        if (hits.length === 0) return null;
        hits.forEach((l) => mark(l, this.meta.id));
        return finding(this.meta, "high", `A link uses a ${hits[0].url.split(":")[0].toLowerCase()}: URI instead of a web address.`, hits.map((l) => ({ label: "Link", value: truncate(l.url, 100) })));
    },
};

export const qrCode: Rule = {
    meta: {
        id: "LINK-009",
        title: "QR code with a link",
        category: "links",
        severity: "medium",
        attack: [ATTACK.link],
        description: "An image contains a QR code that encodes a web address. QR codes move the click to a phone, outside the protection of desktop e-mail security tools.",
        falsePositives: "Tickets, event passes and payment slips.",
    },
    run(ctx) {
        const hits = ctx.links.filter((l) => l.source === "qr");
        if (hits.length === 0) return null;
        hits.forEach((l) => mark(l, this.meta.id));
        return finding(this.meta, "medium", `An image contains a QR code linking to ${hits[0].host ?? "a URI"}.`, hits.map((l) => ({ label: "QR link", value: truncate(l.url), note: l.text ?? undefined })));
    },
};

export const lureWordLink: Rule = {
    meta: {
        id: "LINK-010",
        title: "Link to a domain named with lure words",
        category: "links",
        severity: "medium",
        attack: [ATTACK.link, ATTACK.lookalikeDomain],
        description: "A link goes to a domain made almost entirely of words like secure, account, verify, login or billing (account-verify-center.xyz). Such names are registered to look official without naming a brand.",
        falsePositives: "Some legitimate service domains (secure-login.example.com is fine: only the registrable name is checked).",
    },
    run(ctx) {
        const hits = ctx.links.filter((l) => isLureWordDomain(l.host) && l.domain !== ctx.fromOrg);
        if (hits.length === 0) return null;
        hits.forEach((l) => mark(l, this.meta.id));
        return finding(this.meta, "medium", `A link goes to ${hits[0].domain}, a domain named only with security and account vocabulary.`, hits.map((l) => ({ label: "Link", value: truncate(l.url) })));
    },
};

export const linkRules: Rule[] = [linkTextMismatch, ipAddressLink, urlShortener, brandDeceptiveHost, lookalikeLink, openRedirect, credentialForm, scriptUri, qrCode, lureWordLink];
