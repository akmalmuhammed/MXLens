import type { Link, LinkSource } from "../types.ts";
import { decodeEntities, htmlToText } from "../lib/text.ts";
import { normalizeHost, registrableDomain } from "../lib/domain.ts";
import { REDIRECT_PARAMS } from "../data/lists.ts";

const TEXT_URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"'`{}|\\^]+/gi;

function attr(tag: string, name: string): string | null {
    const re = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
    const m = re.exec(tag);
    if (!m) return null;
    return decodeEntities((m[2] ?? m[3] ?? m[4] ?? "").trim());
}

function cleanUrl(url: string): string {
    // Trailing punctuation from prose ("visit https://x.com/a.") is not part of the URL.
    let u = url.trim().replace(/[.,;:!?'")\]>]+$/, "");
    if (/^www\./i.test(u)) u = "http://" + u;
    return u;
}

export function makeLink(rawUrl: string, source: LinkSource, text: string | null): Link | null {
    const url = cleanUrl(rawUrl);
    if (!url) return null;
    const lower = url.toLowerCase();
    if (lower.startsWith("data:") || lower.startsWith("javascript:") || lower.startsWith("vbscript:")) {
        return { url: url.length > 300 ? url.slice(0, 300) + "…" : url, host: null, domain: null, text, source, flags: [] };
    }
    if (!/^https?:\/\//i.test(url)) return null; // mailto:, tel:, cid:, anchors
    try {
        const parsed = new URL(url);
        const host = normalizeHost(parsed.hostname);
        return { url: parsed.href, host, domain: registrableDomain(host), text, source, flags: [] };
    } catch {
        return null;
    }
}

/** Extracts links from HTML (anchors, areas, forms) and plain text. */
export function extractLinks(html: string | null, text: string | null): Link[] {
    const links: Link[] = [];
    if (html) {
        for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)) {
            const href = attr(m[1], "href");
            if (!href) continue;
            const anchorText = htmlToText(m[2]).replace(/\s+/g, " ").trim() || null;
            const link = makeLink(href, "html", anchorText);
            if (link) links.push(link);
        }
        for (const m of html.matchAll(/<area\b([^>]*)>/gi)) {
            const href = attr(m[1], "href");
            const link = href ? makeLink(href, "html", null) : null;
            if (link) links.push(link);
        }
        for (const m of html.matchAll(/<form\b([^>]*)>/gi)) {
            const action = attr(m[1], "action");
            const link = action ? makeLink(action, "form", null) : null;
            if (link) links.push(link);
        }
        // Bare URLs written as visible text inside the HTML.
        for (const m of htmlToText(html).matchAll(TEXT_URL_RE)) {
            const link = makeLink(m[0], "text", null);
            if (link) links.push(link);
        }
    }
    if (text) {
        for (const m of text.matchAll(TEXT_URL_RE)) {
            const link = makeLink(m[0], "text", null);
            if (link) links.push(link);
        }
    }
    return dedupe(links);
}

function dedupe(links: Link[]): Link[] {
    const seen = new Map<string, Link>();
    for (const link of links) {
        const key = link.url;
        const existing = seen.get(key);
        // Prefer the HTML version, which carries anchor text.
        if (!existing || (!existing.text && link.text)) seen.set(key, link);
    }
    return [...seen.values()];
}

/**
 * If a URL carries another http(s) URL in a redirect-style parameter, returns it.
 * Handles plain, percent-encoded and base64-encoded destinations.
 */
export function redirectTarget(url: string): string | null {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return null;
    }
    for (const [key, value] of parsed.searchParams) {
        if (!REDIRECT_PARAMS.includes(key.toLowerCase())) continue;
        const candidates = [value];
        if (/^[A-Za-z0-9+/_-]{16,}={0,2}$/.test(value)) {
            try {
                const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
                const decoded = typeof atob === "function" ? atob(b64.replace(/^a1/, "")) : "";
                candidates.push(decoded);
            } catch {
                /* not base64 */
            }
        }
        for (const c of candidates) {
            if (/^https?:\/\//i.test(c)) {
                try {
                    return new URL(c).href;
                } catch {
                    /* ignore */
                }
            }
        }
    }
    // Google AMP-style path redirect: /amp/s/target.example/path
    const amp = /\/amp\/s\/([^/?#]+\.[^/?#]+)(\/[^?#]*)?/i.exec(parsed.pathname);
    if (amp) return `https://${amp[1]}${amp[2] ?? "/"}`;
    return null;
}
