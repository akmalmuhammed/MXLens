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
