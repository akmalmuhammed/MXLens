/**
 * Small, dependency-free HTML helpers used by the body analysis.
 * Everything here is bounded (no unbounded nested quantifiers) so hostile HTML
 * cannot cause catastrophic backtracking, and nothing touches the network.
 */

const NAMED_ENTITIES: Record<string, string> = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
    copy: "©", reg: "®", ndash: "–", mdash: "—", hellip: "…"
};

export function decodeHtmlEntities(input: string): string {
    return input.replace(/&(#x[0-9a-f]{1,6}|#\d{1,7}|[a-z]{2,8});/gi, (match, body: string) => {
        if (body[0] === "#") {
            const code = body[1].toLowerCase() === "x" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
            if (code === 0xa0) return " ";
            try {
                return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
            } catch {
                return match;
            }
        }
        return NAMED_ENTITIES[body.toLowerCase()] ?? match;
    });
}

/** Text a recipient would actually read: no tags, scripts, styles or comments; entities decoded. */
export function htmlToVisibleText(html: string): string {
    if (!html) return "";
    const withoutBlocks = html
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<(script|style|head)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ");
    const withoutTags = withoutBlocks.replace(/<[^>]{0,4000}>/g, " ");
    return decodeHtmlEntities(withoutTags).replace(/\s+/g, " ").trim();
}

export interface HtmlAnchor {
    /** href exactly as written, entities decoded. */
    href: string;
    /** Text between the tags, tags stripped, entities decoded, whitespace collapsed. */
    text: string;
    /** Value of data-saferedirecturl (Gmail's rewritten link) when present. */
    safeRedirectUrl?: string;
    /** True when the anchor wraps an <img>, so an empty text is still clickable content. */
    hasImage: boolean;
}

/** Extracts <a href> elements with their visible text. */
export function extractAnchors(html: string, limit = 500): HtmlAnchor[] {
    const anchors: HtmlAnchor[] = [];
    if (!html) return anchors;
    const re = /<a\b([^>]{0,4000})>([\s\S]{0,4000}?)<\/a\s*>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null && anchors.length < limit) {
        const attrs = m[1];
        const href = attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
        if (!href) continue;
        const safe = attrs.match(/\bdata-saferedirecturl\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
        anchors.push({
            href: decodeHtmlEntities(href[1] ?? href[2] ?? href[3] ?? "").trim(),
            text: htmlToVisibleText(m[2]),
            hasImage: /<img\b/i.test(m[2]),
            safeRedirectUrl: safe ? decodeHtmlEntities(safe[1] ?? safe[2] ?? "").trim() : undefined
        });
    }
    return anchors;
}

// Inline styles that make content invisible to the reader while it stays in the
// message source (where spam filters and AI assistants still read it).
const HIDDEN_STYLE = new RegExp([
    "display\\s*:\\s*none",
    "visibility\\s*:\\s*hidden",
    "font-size\\s*:\\s*0*[01](?:\\.0+)?(?:px|pt)?\\s*(?:!important\\s*)?(?:;|$)",
    "font-size\\s*:\\s*0(?:\\.0+)?(?:em|rem|%)\\s*(?:;|$)",
    "opacity\\s*:\\s*0(?:\\.0+)?\\s*(?:;|$)",
    "max-height\\s*:\\s*0(?:px)?\\s*(?:;|$)",
    "mso-hide\\s*:\\s*all"
].join("|"), "i");

export interface HiddenSegment {
    /** Visible-text rendering of the hidden element's content. */
    text: string;
    /** Which CSS rule hid it, for reporting. */
    rule: string;
}

/**
 * Text inside elements a recipient cannot see (display:none, zero font, opacity:0, ...).
 * Matching is bounded and tolerant of malformed HTML; nested hidden elements are
 * reported once, as part of their outermost hidden ancestor.
 */
export function extractHiddenText(html: string, limit = 200): HiddenSegment[] {
    const out: HiddenSegment[] = [];
    if (!html) return out;
    const opener = /<([a-z][a-z0-9]{0,15})\b([^>]{0,2000})>/gi;
    let coveredUntil = -1;
    let m: RegExpExecArray | null;
    while ((m = opener.exec(html)) !== null && out.length < limit) {
        if (m.index < coveredUntil) continue;
        const style = m[2].match(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
        const styleValue = style ? (style[1] ?? style[2] ?? "") : "";
        const hiddenAttr = /\shidden(?:\s|=|$)/i.test(m[2]);
        const rule = styleValue.match(HIDDEN_STYLE)?.[0] ?? (hiddenAttr ? "hidden attribute" : null);
        if (!rule) continue;

        const tag = m[1].toLowerCase();
        if (/^(br|img|hr|input|meta|link|col|area|base|wbr|source)$/.test(tag)) continue;
        const end = findClosing(html, tag, opener.lastIndex);
        const inner = html.slice(opener.lastIndex, end);
        coveredUntil = end;
        const text = htmlToVisibleText(inner);
        if (text) out.push({ text, rule: rule.replace(/\s+/g, "").replace(/;$/, "") });
    }
    return out;
}

function findClosing(html: string, tag: string, from: number): number {
    const re = new RegExp(`<(/?)${tag}\\b[^>]{0,2000}>`, "gi");
    re.lastIndex = from;
    let depth = 1;
    let m: RegExpExecArray | null;
    const max = Math.min(html.length, from + 50000);
    while ((m = re.exec(html)) !== null && m.index < max) {
        depth += m[1] ? -1 : 1;
        if (depth === 0) return m.index;
    }
    return Math.min(html.length, max);
}

/** Text of HTML comments, excluding Outlook conditional-comment markup. */
export function extractCommentText(html: string): string {
    if (!html) return "";
    const parts: string[] = [];
    for (const m of html.matchAll(/<!--([\s\S]{0,20000}?)-->/g)) {
        const body = m[1];
        if (/^\s*\[if\b|<!\[endif\]|^\s*\[endif\]/i.test(body)) continue;
        const text = htmlToVisibleText(body);
        if (text) parts.push(text);
    }
    return parts.join(" ");
}
