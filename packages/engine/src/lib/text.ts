const NAMED_ENTITIES: Record<string, string> = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", copy: "©", reg: "®",
    hellip: "…", mdash: "—", ndash: "–", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", zwnj: "", zwj: "",
};

export function decodeEntities(input: string): string {
    return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
        if (code[0] === "#") {
            const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
            return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : match;
        }
        return NAMED_ENTITIES[code.toLowerCase()] ?? match;
    });
}

/** Visible-ish text from HTML: drops head, scripts and styles, keeps link text. */
export function htmlToText(html: string): string {
    return decodeEntities(
        html
            .replace(/<!--[\s\S]*?-->/g, " ")
            .replace(/<(head|script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, " ")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/(p|div|tr|li|h[1-6]|table)>/gi, "\n")
            .replace(/<[^>]+>/g, " "),
    )
        .replace(/[ \t\f\v ]+/g, " ")
        .replace(/\s*\n\s*/g, "\n")
        .trim();
}

const HIDDEN_STYLE = /(display\s*:\s*none|visibility\s*:\s*hidden|font-size\s*:\s*0(?:px|pt|em|%)?\s*[;"']|opacity\s*:\s*0(?:\.0+)?\s*[;"']|max-height\s*:\s*0|width\s*:\s*0(?:px)?\s*;\s*height\s*:\s*0)/i;

/**
 * Amount of text inside elements styled to be invisible. Marketing "preheader"
 * text is hidden too, so callers should treat only large amounts as suspicious.
 */
export function hiddenTextLength(html: string): number {
    let total = 0;
    const re = /<([a-z0-9]+)\b([^>]*\bstyle\s*=\s*("[^"]*"|'[^']*')[^>]*)>([\s\S]*?)<\/\1>/gi;
    for (const m of html.matchAll(re)) {
        if (HIDDEN_STYLE.test(m[3] + ";")) total += htmlToText(m[4]).length;
    }
    return total;
}

const EN_STOPWORDS = new Set([
    "the", "and", "you", "your", "to", "of", "a", "in", "is", "for", "on", "that", "this", "with",
    "please", "we", "it", "be", "are", "have", "will", "our", "from", "or", "as", "at", "by", "an",
    "not", "can", "if", "has", "account", "click", "here", "been",
]);

/** Rough check that text is English, so English-only keyword rules are not run on other languages. */
export function looksEnglish(text: string): boolean {
    const letters = text.replace(/[^\p{L}]/gu, "");
    if (letters.length < 20) return true;
    const latin = letters.replace(/[^a-zA-Z]/g, "").length;
    if (latin / letters.length < 0.7) return false;
    const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
    if (words.length < 8) return true;
    const hits = words.filter((w) => EN_STOPWORDS.has(w)).length;
    return hits / words.length >= 0.08;
}

export function truncate(value: string, max = 160): string {
    return value.length > max ? value.slice(0, max - 1) + "…" : value;
}

/** Makes an indicator safe to paste: hxxp, [.] and [@]. */
export function defang(value: string): string {
    return value
        .replace(/^http/i, (m) => (m[0] === "H" ? "Hxxp" : "hxxp"))
        .replace(/\./g, "[.]")
        .replace(/@/g, "[@]");
}
