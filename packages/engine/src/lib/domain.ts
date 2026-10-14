import { getDomain, getPublicSuffix } from "tldts";
import { BRANDS, LURE_TOKENS } from "../data/brands.ts";
import type { Brand } from "../data/brands.ts";
import { FREEMAIL_DOMAINS } from "../data/lists.ts";

/** Lower-cases and strips a trailing dot and surrounding brackets. */
export function normalizeHost(host: string): string {
    return host.trim().toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
}

/** Domain part of an e-mail address, lower-cased. */
export function domainOfAddress(address: string | null | undefined): string | null {
    if (!address) return null;
    const at = address.lastIndexOf("@");
    if (at < 0 || at === address.length - 1) return null;
    return normalizeHost(address.slice(at + 1).replace(/>$/, ""));
}

/**
 * Registrable domain (eTLD+1) using the Public Suffix List, including private
 * suffixes so that tenants on shared hosts (name.github.io) stay distinct.
 */
export function registrableDomain(host: string | null | undefined): string | null {
    if (!host) return null;
    const h = normalizeHost(host);
    if (isIpLiteral(h)) return null;
    return getDomain(h, { allowPrivateDomains: true }) ?? null;
}

export function publicSuffix(host: string): string | null {
    return getPublicSuffix(normalizeHost(host), { allowPrivateDomains: true }) ?? null;
}

/** True when `host` equals `domain` or is a subdomain of it. */
export function isSameOrSubdomain(host: string, domain: string): boolean {
    const h = normalizeHost(host);
    const d = normalizeHost(domain);
    return h === d || h.endsWith("." + d);
}

export function sameOrganization(a: string | null, b: string | null): boolean {
    if (!a || !b) return false;
    const ra = registrableDomain(a) ?? normalizeHost(a);
    const rb = registrableDomain(b) ?? normalizeHost(b);
    return ra === rb;
}

export function isFreemail(domain: string | null): boolean {
    if (!domain) return false;
    const reg = registrableDomain(domain) ?? domain;
    return FREEMAIL_DOMAINS.has(reg) || FREEMAIL_DOMAINS.has(normalizeHost(domain));
}

/** The brand that owns `host`, or null. Free-mail domains never count as a brand's own. */
export function brandOwningHost(host: string | null): Brand | null {
    if (!host || isFreemail(host)) return null;
    for (const brand of BRANDS) {
        if (brand.domains.some((d) => isSameOrSubdomain(host, d))) return brand;
    }
    return null;
}

/** Brands named in free text (display names, link text). Matches whole words only. */
export function brandsMentioned(text: string | null | undefined): Brand[] {
    if (!text) return [];
    const haystack = ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, " ")} `;
    const found: Brand[] = [];
    for (const brand of BRANDS) {
        if (brand.keywords.some((k) => haystack.includes(` ${k.replace(/[^a-z0-9]+/g, " ")} `))) {
            found.push(brand);
        }
    }
    return found;
}

// ---------------------------------------------------------------------------
// IP literals
// ---------------------------------------------------------------------------

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function isIpLiteral(host: string): boolean {
    const h = normalizeHost(host);
    if (IPV4.test(h)) return true;
    if (h.includes(":") && /^[0-9a-f:.]+$/i.test(h)) return true;
    // Decimal (http://3232235777/), hex (0xC0A80001) or octal-dotted forms.
    if (/^\d{8,10}$/.test(h)) return true;
    if (/^0x[0-9a-f]{1,8}$/i.test(h)) return true;
    if (/^(0x[0-9a-f]+|0[0-7]*|\d+)(\.(0x[0-9a-f]+|0[0-7]*|\d+)){1,3}$/i.test(h) && /(^|\.)0[x0-7]/i.test(h)) return true;
    return false;
}

/** True for private, loopback, link-local and other non-routable addresses. */
export function isPrivateIp(ip: string): boolean {
    const h = normalizeHost(ip);
    const m = IPV4.exec(h.startsWith("::ffff:") ? h.slice(7) : h);
    if (m) {
        const a = Number(m[1]);
        const b = Number(m[2]);
        return (
            a === 10 || a === 127 || a === 0 ||
            (a === 172 && b >= 16 && b <= 31) ||
            (a === 192 && b === 168) ||
            (a === 169 && b === 254) ||
            (a === 100 && b >= 64 && b <= 127)
        );
    }
    return h === "::1" || /^f[cd]/.test(h) || /^fe[89ab]/.test(h);
}

// ---------------------------------------------------------------------------
// Punycode (RFC 3492) decoding, so IDN hosts can be shown and compared.
// ---------------------------------------------------------------------------

function decodePunycodeLabel(input: string): string | null {
    const base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700;
    const output: number[] = [];
    let i = 0, n = 128, bias = 72;
    const basic = input.lastIndexOf("-");
    for (let j = 0; j < Math.max(basic, 0); j++) {
        if (input.charCodeAt(j) >= 0x80) return null;
        output.push(input.charCodeAt(j));
    }
    const adapt = (delta: number, numPoints: number, first: boolean): number => {
        let k = 0;
        delta = first ? Math.floor(delta / damp) : delta >> 1;
        delta += Math.floor(delta / numPoints);
        while (delta > ((base - tMin) * tMax) >> 1) {
            delta = Math.floor(delta / (base - tMin));
            k += base;
        }
        return k + Math.floor(((base - tMin + 1) * delta) / (delta + skew));
    };
    for (let index = basic > 0 ? basic + 1 : 0; index < input.length;) {
        const oldi = i;
        for (let w = 1, k = base; ; k += base) {
            if (index >= input.length) return null;
            const c = input.charCodeAt(index++);
            const digit = c - 48 < 10 ? c - 22 : c - 65 < 26 ? c - 65 : c - 97 < 26 ? c - 97 : base;
            if (digit >= base) return null;
            i += digit * w;
            const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
            if (digit < t) break;
            w *= base - t;
        }
        bias = adapt(i - oldi, output.length + 1, oldi === 0);
        n += Math.floor(i / (output.length + 1));
        i %= output.length + 1;
        output.splice(i++, 0, n);
    }
    return String.fromCodePoint(...output);
}

/** Converts xn-- labels to Unicode. Leaves other labels unchanged. */
export function toUnicodeHost(host: string): string {
    return normalizeHost(host)
        .split(".")
        .map((label) => (label.startsWith("xn--") ? decodePunycodeLabel(label.slice(4)) ?? label : label))
        .join(".");
}

/** ASCII (punycode) form of a host, using the platform URL parser. */
export function toAsciiHost(host: string): string {
    try {
        return new URL(`http://${normalizeHost(host)}/`).hostname;
    } catch {
        return normalizeHost(host);
    }
}

// ---------------------------------------------------------------------------
// Lookalike detection
// ---------------------------------------------------------------------------

/** Characters from other scripts that render like Latin letters (subset of Unicode confusables). */
const CONFUSABLES: Record<string, string> = {
    "а": "a", "в": "b", "е": "e", "ё": "e", "к": "k", "м": "m", "н": "h", "о": "o", "р": "p",
    "с": "c", "т": "t", "у": "y", "х": "x", "і": "i", "ї": "i", "ј": "j", "ѕ": "s", "һ": "h",
    "ԁ": "d", "ԛ": "q", "ԝ": "w", "ӏ": "l", "ɡ": "g", "ı": "i", "ℓ": "l",
    "α": "a", "ο": "o", "ε": "e", "ν": "v", "ρ": "p", "τ": "t", "ι": "i", "κ": "k", "υ": "u",
    "χ": "x", "ω": "w", "ѡ": "w", "ս": "u", "օ": "o", "ց": "g", "զ": "q",
    "à": "a", "á": "a", "â": "a", "ä": "a", "å": "a", "ã": "a", "è": "e", "é": "e", "ê": "e",
    "ë": "e", "ì": "i", "í": "i", "î": "i", "ï": "i", "ò": "o", "ó": "o", "ô": "o", "ö": "o",
    "õ": "o", "ù": "u", "ú": "u", "û": "u", "ü": "u", "ç": "c", "ñ": "n", "ý": "y", "ÿ": "y",
};

/** Maps a label to the ASCII it imitates: Unicode confusables and ASCII tricks (rn→m, 0→o). */
export function skeleton(label: string): string {
    let s = "";
    for (const ch of label.normalize("NFC").toLowerCase()) s += CONFUSABLES[ch] ?? ch;
    return s
        .replace(/rn/g, "m")
        .replace(/vv/g, "w")
        .replace(/cl/g, "d")
        .replace(/0/g, "o")
        .replace(/1/g, "l")
        .replace(/3/g, "e")
        .replace(/5/g, "s")
        .replace(/\$/g, "s")
        .replace(/@/g, "a");
}

/** Damerau-Levenshtein (optimal string alignment) distance, capped for speed. */
export function editDistance(a: string, b: string, max = 3): number {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
    for (let j = 0; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
            }
        }
    }
    return d[a.length][b.length];
}

function hasNonLatinLetters(label: string): boolean {
    return /[^\u0000-ɏ]/.test(label);
}

function hasMixedScripts(label: string): boolean {
    const latin = /[a-z]/i.test(label);
    const cyrillic = /[Ѐ-ӿ]/.test(label);
    const greek = /[Ͱ-Ͽ]/.test(label);
    const armenian = /[԰-֏]/.test(label);
    return [latin, cyrillic, greek, armenian].filter(Boolean).length > 1;
}

export type LookalikeKind = "homograph" | "typosquat" | "combosquat";

export interface Lookalike {
    kind: LookalikeKind;
    /** "high" for homographs, character swaps and combosquats; "medium" for plain edit distance. */
    confidence: "high" | "medium";
    brand: Brand;
    /** The brand domain being imitated. */
    target: string;
    /** Unicode form of the suspicious host, for display. */
    displayHost: string;
}

/**
 * Checks whether `host` imitates one of the known brands without belonging to it.
 * Returns null for the brand's own domains and for unrelated domains.
 */
export function findLookalike(host: string | null): Lookalike | null {
    if (!host) return null;
    const ascii = toAsciiHost(host);
    if (isIpLiteral(ascii) || brandOwningHost(ascii)) return null;

    const unicodeHost = toUnicodeHost(ascii);
    const reg = registrableDomain(ascii);
    if (!reg) return null;
    const suffix = publicSuffix(ascii) ?? "";
    const regLabel = toUnicodeHost(reg).slice(0, -(suffix.length + 1)) || toUnicodeHost(reg);

    for (const brand of BRANDS) {
        for (const domain of brand.domains) {
            const brandSuffix = publicSuffix(domain) ?? "";
            const brandLabel = domain.slice(0, -(brandSuffix.length + 1));
            if (!brandLabel || brandLabel.length < 4) continue;

            // 1. Homograph: different characters that render as the brand.
            if (hasNonLatinLetters(regLabel) || /[à-ÿ]/.test(regLabel)) {
                if (skeleton(regLabel) === brandLabel) {
                    return { kind: "homograph", confidence: "high", brand, target: domain, displayHost: unicodeHost };
                }
            }

            // 2. Typosquat: one or two edits away, or the same after ASCII tricks.
            if (regLabel !== brandLabel && /^[a-z0-9-]+$/.test(regLabel)) {
                const maxEdits = brandLabel.length >= 8 ? 2 : brandLabel.length >= 5 ? 1 : 0;
                const tricksMatch = skeleton(regLabel) === brandLabel;
                if (tricksMatch) {
                    return { kind: "typosquat", confidence: "high", brand, target: domain, displayHost: unicodeHost };
                }
                if (maxEdits > 0 && editDistance(regLabel, brandLabel, maxEdits) <= maxEdits) {
                    return { kind: "typosquat", confidence: "medium", brand, target: domain, displayHost: unicodeHost };
                }
            }

            // 3. Combosquat: the brand as a whole token beside a lure word (paypal-secure-login).
            if (brandLabel.length >= 5 && /^[a-z0-9-]+$/.test(regLabel) && regLabel !== brandLabel) {
                const hyphenTokens = regLabel.split("-").filter(Boolean);
                const digitTokens = regLabel.split(/-|(?<=[a-z])(?=\d)|(?<=\d)(?=[a-z])/).filter(Boolean);
                for (const tokens of [hyphenTokens, digitTokens]) {
                    if (tokens.map((t) => skeleton(t)).includes(brandLabel) && tokens.some((t) => LURE_TOKENS.has(t))) {
                        return { kind: "combosquat", confidence: "high", brand, target: domain, displayHost: unicodeHost };
                    }
                }
                const joined = skeleton(regLabel.replace(/-/g, ""));
                for (const lure of LURE_TOKENS) {
                    if (lure.length < 3) continue;
                    if (joined === brandLabel + lure || joined === lure + brandLabel) {
                        return { kind: "combosquat", confidence: "high", brand, target: domain, displayHost: unicodeHost };
                    }
                }
            }
        }
    }

    return null;
}

/** True when a label mixes Latin with Cyrillic, Greek or Armenian letters. */
export function isMixedScriptHost(host: string): boolean {
    return toUnicodeHost(host).split(".").some((label) => hasMixedScripts(label));
}

/**
 * Brand-deception host: a brand's name appears as a host label (paypal.com.evil.net,
 * login.microsoftonline.secure-auth.top) while the registrable domain is unrelated.
 */
export function brandInHostLabels(host: string | null): { brand: Brand; label: string } | null {
    if (!host || isIpLiteral(host) || brandOwningHost(host)) return null;
    const reg = registrableDomain(host);
    if (!reg) return null;
    const prefix = normalizeHost(host).slice(0, -(reg.length + 1));
    if (!prefix) return null;
    const labels = prefix.split(".");
    for (const brand of BRANDS) {
        for (const domain of brand.domains) {
            const brandSuffix = publicSuffix(domain) ?? "";
            const brandLabel = domain.slice(0, -(brandSuffix.length + 1));
            if (brandLabel.length < 4) continue;
            // The full brand domain embedded as labels, e.g. "paypal.com" inside "paypal.com.evil.net".
            if (prefix === domain || prefix.endsWith("." + domain) || prefix.startsWith(domain + ".") || prefix.includes("." + domain + ".")) {
                return { brand, label: domain };
            }
            if (labels.some((l) => l === brandLabel || l.startsWith(brandLabel + "-") || l.endsWith("-" + brandLabel))) {
                return { brand, label: brandLabel };
            }
        }
    }
    return null;
}

/**
 * A registrable domain built almost entirely from lure words, such as
 * account-verify-center.xyz or secure-billing-update.info. Legitimate
 * organizations rarely name a domain after nothing but security vocabulary.
 */
export function isLureWordDomain(host: string | null): boolean {
    if (!host || isIpLiteral(host) || brandOwningHost(host)) return false;
    const reg = registrableDomain(host);
    if (!reg) return false;
    const suffix = publicSuffix(host) ?? "";
    const label = reg.slice(0, -(suffix.length + 1));
    const tokens = label.split("-").filter(Boolean);
    if (tokens.length < 2) return false;
    const lure = tokens.filter((t) => LURE_TOKENS.has(t)).length;
    return lure >= 2 && lure / tokens.length >= 0.66;
}
