import type { Hop } from "../types.ts";

const IPV4_RE = /\b(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}\b/;
const IPV6_RE = /\b(?:IPv6:)?((?:[0-9a-f]{1,4}:){2,7}[0-9a-f]{1,4}|(?:[0-9a-f]{1,4}:){1,7}:(?:[0-9a-f]{1,4})?)\b/i;

function extractIp(text: string): string | null {
    // Prefer the bracketed/parenthesised address the receiving server recorded.
    const bracket = /[[(]\s*(?:IPv6:)?([0-9a-f:.]+)\s*[\])]/i.exec(text);
    if (bracket && (IPV4_RE.test(bracket[1]) || IPV6_RE.test(bracket[1]))) {
        const v4 = IPV4_RE.exec(bracket[1]);
        return v4 ? v4[0] : bracket[1].toLowerCase();
    }
    const v4 = IPV4_RE.exec(text);
    if (v4) return v4[0];
    const v6 = IPV6_RE.exec(text);
    return v6 ? v6[1].toLowerCase() : null;
}

function clause(value: string, keyword: string): string | null {
    const re = new RegExp(`\\b${keyword}\\s+([^\\s;()]+)`, "i");
    const m = re.exec(value);
    return m ? m[1].toLowerCase() : null;
}

/**
 * Parses Received headers (given top first, as they appear) into hops ordered
 * from the first relay to the recipient's server.
 */
export function parseReceived(values: string[]): Hop[] {
    const hops = values
        .slice()
        .reverse()
        .map((raw) => {
            const semicolon = raw.lastIndexOf(";");
            const datePart = semicolon >= 0 ? raw.slice(semicolon + 1).trim() : "";
            const body = semicolon >= 0 ? raw.slice(0, semicolon) : raw;
            const fromSection = /\bfrom\s+([\s\S]*?)(?=\bby\b|$)/i.exec(body)?.[1] ?? "";
            const parsed = datePart ? Date.parse(datePart.replace(/\s+\([^)]*\)\s*$/, "")) : NaN;
            return {
                from: clause(body, "from"),
                by: clause(body, "by"),
                with: clause(body, "with"),
                ip: extractIp(fromSection),
                timestamp: Number.isNaN(parsed) ? null : new Date(parsed).toISOString(),
                raw,
            };
        });

    return hops.map((h, i) => {
        const prev = i > 0 ? hops[i - 1].timestamp : null;
        const delay = prev && h.timestamp ? Math.round((Date.parse(h.timestamp) - Date.parse(prev)) / 1000) : null;
        return { index: i + 1, ...h, delaySeconds: delay };
    });
}
