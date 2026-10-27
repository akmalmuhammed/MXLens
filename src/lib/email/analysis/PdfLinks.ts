/**
 * Dependency-free PDF link extraction that runs in Node (CLI) and browsers alike.
 * Reads /URI actions from plain objects and from Flate-compressed object streams.
 * Bounded: at most 10 MB scanned, 64 streams inflated, 4 MB inflated per stream.
 */
const MAX_SCAN = 10 * 1024 * 1024;
const MAX_STREAMS = 64;
const MAX_INFLATED = 4 * 1024 * 1024;

export async function extractPdfUris(bytes: Uint8Array): Promise<string[]> {
    const found = new Set<string>();
    const latin1 = toLatin1(bytes.subarray(0, MAX_SCAN));
    collectUris(latin1, found);

    if (typeof DecompressionStream === "function") {
        const streamRe = /\/FlateDecode[\s\S]{0,400}?stream\r?\n/g;
        let m: RegExpExecArray | null;
        let count = 0;
        while ((m = streamRe.exec(latin1)) !== null && count < MAX_STREAMS) {
            const start = m.index + m[0].length;
            const end = latin1.indexOf("endstream", start);
            if (end < 0) break;
            count++;
            // Drop the EOL before "endstream"; zlib rejects trailing bytes.
            let dataEnd = end;
            while (dataEnd > start && (latin1.charCodeAt(dataEnd - 1) === 10 || latin1.charCodeAt(dataEnd - 1) === 13)) dataEnd--;
            const inflated = await inflate(bytes.subarray(start, dataEnd));
            if (inflated) collectUris(inflated, found);
            streamRe.lastIndex = end;
        }
    }
    return [...found].filter(u => /^(?:https?|ftp|file|javascript|data):/i.test(u)).slice(0, 200);
}

function collectUris(text: string, out: Set<string>) {
    for (const m of text.matchAll(/\/URI\s*\(((?:\\.|[^\\)]){1,4000})\)/g)) out.add(unescapePdfString(m[1]).trim());
    for (const m of text.matchAll(/\/URI\s*<([0-9A-Fa-f\s]{2,8000})>/g)) {
        const hex = m[1].replace(/\s+/g, "");
        let s = "";
        for (let i = 0; i + 1 < hex.length; i += 2) s += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
        out.add(s.trim());
    }
}

function unescapePdfString(s: string): string {
    return s.replace(/\\(?:([nrtbf()\\])|([0-7]{1,3})|\r?\n)/g, (_, c: string | undefined, oct: string | undefined) => {
        if (oct) return String.fromCharCode(parseInt(oct, 8));
        switch (c) {
            case "n": return "\n";
            case "r": return "\r";
            case "t": return "\t";
            case "b": return "\b";
            case "f": return "\f";
            case undefined: return "";
            default: return c;
        }
    });
}

function toLatin1(bytes: Uint8Array): string {
    let out = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        out += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return out;
}

async function inflate(data: Uint8Array): Promise<string | null> {
    try {
        const copy = new Uint8Array(data.byteLength);
        copy.set(data);
        const stream = new Blob([copy.buffer]).stream().pipeThrough(new DecompressionStream("deflate"));
        const reader = stream.getReader();
        const parts: Uint8Array[] = [];
        let total = 0;
        try {
            for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                total += value.byteLength;
                parts.push(value);
                if (total > MAX_INFLATED) {
                    await reader.cancel();
                    break;
                }
            }
        } catch {
            // Corrupt or truncated stream: keep whatever inflated before the error.
            if (parts.length === 0) return null;
        }
        const merged = new Uint8Array(Math.min(total, MAX_INFLATED));
        let offset = 0;
        for (const p of parts) {
            const take = Math.min(p.byteLength, merged.length - offset);
            merged.set(p.subarray(0, take), offset);
            offset += take;
            if (offset >= merged.length) break;
        }
        return toLatin1(merged);
    } catch {
        return null;
    }
}
