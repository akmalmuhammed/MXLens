import type { AuthResult, AuthenticationInfo, DkimResult } from "../types.ts";
import { domainOfAddress, normalizeHost, registrableDomain } from "../lib/domain.ts";

/** One parsed `method=result` entry from Authentication-Results (RFC 8601). */
export interface ResInfo {
    method: string;
    result: AuthResult;
    /** ptype.property → value, e.g. "header.d" → "example.com". */
    props: Record<string, string>;
    /** Text including comments, for policy hints such as "(p=REJECT)". */
    raw: string;
}

export interface ParsedAuthResults {
    authservId: string;
    results: ResInfo[];
    raw: string;
}

const KNOWN_RESULTS = new Set<AuthResult>(["pass", "fail", "softfail", "neutral", "none", "temperror", "permerror", "policy"]);

function toResult(value: string): AuthResult {
    const v = value.toLowerCase();
    if (v === "hardfail") return "fail";
    if (v === "bestguesspass") return "pass";
    return KNOWN_RESULTS.has(v as AuthResult) ? (v as AuthResult) : "unknown";
}

/** Removes RFC 5322 comments (possibly nested) while respecting quoted strings. */
export function stripComments(input: string): string {
    let out = "";
    let depth = 0;
    let quoted = false;
    for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (ch === "\\" && i + 1 < input.length) {
            if (depth === 0) out += ch + input[i + 1];
            i++;
            continue;
        }
        if (ch === '"' && depth === 0) quoted = !quoted;
        if (!quoted) {
            if (ch === "(") { depth++; continue; }
            if (ch === ")" && depth > 0) { depth--; continue; }
        }
        if (depth === 0) out += ch;
    }
    return out;
}

/** Splits on `;` outside comments and quotes. */
function splitTopLevel(input: string): string[] {
    const parts: string[] = [];
    let depth = 0;
    let quoted = false;
    let current = "";
    for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (ch === "\\") { current += ch + (input[i + 1] ?? ""); i++; continue; }
        if (ch === '"' && depth === 0) quoted = !quoted;
        if (!quoted) {
            if (ch === "(") depth++;
            if (ch === ")" && depth > 0) depth--;
            if (ch === ";" && depth === 0) { parts.push(current); current = ""; continue; }
        }
        current += ch;
    }
    parts.push(current);
    return parts.map((p) => p.trim()).filter(Boolean);
}

/** Parses one Authentication-Results (or ARC-Authentication-Results) header value. */
export function parseAuthenticationResults(value: string, isArc = false): ParsedAuthResults {
    const parts = splitTopLevel(value);
    let head = parts.shift() ?? "";
    // ARC-Authentication-Results starts with "i=N;" before the authserv-id.
    if (isArc && /^\s*i\s*=\s*\d+\s*$/i.test(stripComments(head))) head = parts.shift() ?? "";
    const authservId = stripComments(head).trim().split(/\s+/)[0]?.toLowerCase() ?? "";
    const results: ResInfo[] = [];
    for (const part of parts) {
        const clean = stripComments(part).trim();
        const m = /^([a-z0-9_-]+)\s*=\s*([a-z]+)/i.exec(clean);
        if (!m) continue;
        const props: Record<string, string> = {};
        const propRe = /([a-z0-9_-]+\.[a-z0-9_-]+|reason|action|policy)\s*=\s*("([^"]*)"|[^\s;]+)/gi;
        for (const pm of clean.slice(m[0].length).matchAll(propRe)) {
            props[pm[1].toLowerCase()] = (pm[3] ?? pm[2]).trim();
        }
        results.push({ method: m[1].toLowerCase(), result: toResult(m[2]), props, raw: part });
    }
    return { authservId, results, raw: value };
}

/** DMARC policy from "p=reject" style hints or Microsoft's "action=" property. Never matches "sp=". */
function dmarcPolicy(info: ResInfo): string | null {
    const m = /(?:^|[\s(;])p\s*=\s*(none|quarantine|reject)\b/i.exec(info.raw);
    if (m) return m[1].toLowerCase();
    const action = info.props["action"];
    if (action) return action.toLowerCase() === "oreject" ? "reject" : action.toLowerCase();
    return null;
}

function first(results: ResInfo[], method: string): ResInfo | undefined {
    return results.find((r) => r.method === method);
}

interface ArcSeal { instance: number; cv: string; domain: string | null }

function parseTags(value: string): Record<string, string> {
    const tags: Record<string, string> = {};
    for (const part of value.split(";")) {
        const eq = part.indexOf("=");
        if (eq < 0) continue;
        tags[part.slice(0, eq).trim().toLowerCase()] = part.slice(eq + 1).replace(/\s+/g, "").trim();
    }
    return tags;
}

export interface AuthInputs {
    authenticationResults: string[];
    arcSeals: string[];
    arcAuthResults: string[];
    dkimSignatures: string[];
    fromAddress: string | null;
    returnPath: string | null;
}

export function analyzeAuthentication(input: AuthInputs, trustedIds: string[] | undefined): AuthenticationInfo {
    const parsed = input.authenticationResults.map((v) => parseAuthenticationResults(v));
    const trusted = (trustedIds ?? []).map((s) => s.toLowerCase());

    let chosen: ParsedAuthResults | undefined;
    let trust: AuthenticationInfo["trust"] = "none";
    if (trusted.length > 0) {
        chosen = parsed.find((p) => trusted.some((t) => p.authservId === t || p.authservId.endsWith("." + t)));
        if (chosen) trust = "configured";
    } else if (parsed.length > 0) {
        chosen = parsed[0];
        trust = "assumed";
    }

    const results = chosen?.results ?? [];
    const spf = first(results, "spf");
    const dmarc = first(results, "dmarc");
    const arc = first(results, "arc");
    const compauth = first(results, "compauth");

    const dkim: DkimResult[] = results
        .filter((r) => r.method === "dkim")
        .map((r) => ({
            result: r.result,
            domain: r.props["header.d"] ? normalizeHost(r.props["header.d"]) : r.props["header.i"] ? domainOfAddress(r.props["header.i"]) : null,
            selector: r.props["header.s"] ?? null,
        }));

    // Fall back to DKIM-Signature d= tags when the receiver did not name the domain.
    if (dkim.length === 0 && input.dkimSignatures.length > 0 && chosen) {
        for (const sig of input.dkimSignatures) {
            const tags = parseTags(sig);
            dkim.push({ result: "unknown", domain: tags["d"] ? normalizeHost(tags["d"]) : null, selector: tags["s"] ?? null });
        }
    }

    const spfDomain = spf
        ? domainOfAddress(spf.props["smtp.mailfrom"]) ?? (spf.props["smtp.mailfrom"] ? normalizeHost(spf.props["smtp.mailfrom"]) : null) ?? (spf.props["smtp.helo"] ? normalizeHost(spf.props["smtp.helo"]) : null)
        : null;

    // Relaxed alignment against the From domain's organizational domain.
    const fromOrg = registrableDomain(domainOfAddress(input.fromAddress));
    const dkimAligned = !!fromOrg && dkim.some((d) => d.result === "pass" && d.domain !== null && registrableDomain(d.domain) === fromOrg);
    const spfAligned = !!fromOrg && spf?.result === "pass" && spfDomain !== null && registrableDomain(spfDomain) === fromOrg;

    // ARC: trust only the receiver's own verdict (arc=pass in its Authentication-Results).
    const seals: ArcSeal[] = input.arcSeals.map((s) => {
        const tags = parseTags(s);
        return { instance: Number(tags["i"] ?? 0), cv: (tags["cv"] ?? "").toLowerCase(), domain: tags["d"] ? normalizeHost(tags["d"]) : null };
    });
    let original: AuthenticationInfo["arc"]["original"] = null;
    const aar1 = input.arcAuthResults.find((v) => /^\s*i\s*=\s*1\s*;/i.test(v));
    if (aar1) {
        const p = parseAuthenticationResults(aar1, true);
        original = {
            spf: first(p.results, "spf")?.result ?? "none",
            dkim: first(p.results, "dkim")?.result ?? "none",
            dmarc: first(p.results, "dmarc")?.result ?? "none",
        };
    }

    return {
        present: parsed.length > 0,
        authservId: chosen?.authservId ?? null,
        trust,
        spf: { result: spf?.result ?? "none", domain: spfDomain },
        dkim,
        dmarc: {
            result: dmarc?.result ?? "none",
            policy: dmarc ? dmarcPolicy(dmarc) : null,
            domain: dmarc?.props["header.from"] ? normalizeHost(dmarc.props["header.from"]) : null,
        },
        arc: {
            result: arc?.result ?? "none",
            instances: seals.length,
            sealedBy: seals.sort((a, b) => b.instance - a.instance).map((s) => s.domain).filter((d): d is string => !!d),
            original,
        },
        compauth: compauth?.result ?? null,
        alignment: { dkim: dkimAligned, spf: spfAligned },
        headers: parsed.map((p) => ({ authservId: p.authservId, raw: p.raw })),
    };
}
