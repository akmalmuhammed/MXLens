/**
 * SDK-free analysis logic for the MCP server, so it can be unit-tested without
 * the transport layer. src/index.ts wires these into MCP tools.
 */
import { analyzeEmail, toMarkdown, toStix } from "@mxlens/engine";
import type { AnalysisResult } from "@mxlens/engine";

export type OutputFormat = "summary" | "full" | "markdown" | "stix";

export function decodeInput(raw: string, encoding: "auto" | "base64"): Uint8Array {
    const trimmed = raw.trim();
    const looksBase64 = /^[A-Za-z0-9+/\r\n]+={0,2}$/.test(trimmed) && trimmed.length > 80 && !trimmed.includes(":");
    if (encoding === "base64" || (encoding === "auto" && looksBase64)) {
        try {
            return new Uint8Array(Buffer.from(trimmed, "base64"));
        } catch {
            /* fall back to utf-8 */
        }
    }
    return new TextEncoder().encode(raw);
}

/** Compact, model-friendly digest of a result. */
export function digest(result: AnalysisResult): Record<string, unknown> {
    return {
        verdict: result.verdict,
        verdictLabel: result.verdictLabel,
        riskScore: result.riskScore,
        summary: result.summary,
        from: result.message.from?.address ?? null,
        subject: result.message.subject,
        authentication: {
            spf: result.authentication.spf.result,
            dkim: result.authentication.dkim.map((d) => d.result),
            dmarc: result.authentication.dmarc.result,
            trust: result.authentication.trust,
        },
        findings: result.findings.map((f) => ({ id: f.ruleId, severity: f.severity, summary: f.summary, attack: f.attack.map((a) => a.id) })),
        indicators: result.indicators,
        notChecked: result.coverage.skipped,
    };
}

export interface AnalyzeArgs {
    email: string;
    encoding?: "auto" | "base64";
    trustedAuthservIds?: string[];
    format?: OutputFormat;
}

export async function runAnalyze(args: AnalyzeArgs): Promise<{ text: string; structured: Record<string, unknown> }> {
    const result = await analyzeEmail(decodeInput(args.email, args.encoding ?? "auto"), { trustedAuthservIds: args.trustedAuthservIds });
    const structured = digest(result);
    let text: string;
    switch (args.format ?? "summary") {
        case "markdown": text = toMarkdown(result); break;
        case "stix": text = JSON.stringify(toStix(result), null, 2); break;
        case "full": text = JSON.stringify(result, null, 2); break;
        default: text = JSON.stringify(structured, null, 2);
    }
    return { text, structured };
}
