import type { AnalysisResult, AnalyzeOptions, Coverage, Finding, Indicators } from "./types.ts";
import { buildContext } from "./context.ts";
import type { Context, RawInput } from "./context.ts";
import { RULES } from "./rules/index.ts";
import { addRedirectTargets } from "./rules/links.ts";
import { riskScore, sortFindings, verdictFor, VERDICT_LABELS } from "./score.ts";
import { ENGINE_VERSION } from "./version.ts";
import { brandOwningHost } from "./lib/domain.ts";

function unique<T>(values: (T | null | undefined)[]): T[] {
    return [...new Set(values.filter((v): v is T => v !== null && v !== undefined && v !== ""))];
}

function indicators(ctx: Context): Indicators {
    const m = ctx.message;
    return {
        ips: unique(ctx.hops.map((h) => h.ip)),
        domains: unique([
            ctx.fromDomain,
            ...ctx.replyToDomains,
            ctx.returnPathDomain,
            ...ctx.auth.dkim.map((d) => d.domain),
            ...ctx.links.map((l) => l.host),
        ]),
        urls: unique(ctx.links.filter((l) => l.host).map((l) => l.url)),
        emails: unique([m.from?.address, m.sender?.address, ...m.replyTo.map((r) => r.address), m.returnPath?.includes("@") ? m.returnPath.toLowerCase() : null]),
        sha256: unique(ctx.attachments.map((a) => a.sha256)),
    };
}

function coverage(ctx: Context): Coverage {
    const checked: string[] = ["Sender identity"];
    if (ctx.auth.present) checked.push(`Authentication results (${ctx.auth.authservId ?? "unknown server"})`);
    if (ctx.hops.length) checked.push(`Delivery path (${ctx.hops.length} hop${ctx.hops.length > 1 ? "s" : ""})`);
    if (ctx.options.analyzeBody && ctx.hasBody) checked.push(`Links (${ctx.links.length})`);
    if (ctx.options.analyzeBody && ctx.text && ctx.english) checked.push("Language rules (English)");
    if (ctx.options.analyzeAttachments && ctx.attachments.length) checked.push(`Attachments (${ctx.attachments.length})`);
    return { checked, skipped: ctx.notes };
}

function summarize(findings: Finding[], ctx: Context): string[] {
    const meaningful = findings.filter((f) => f.severity !== "info");
    if (meaningful.length === 0) {
        const lines = ["No strong phishing indicators were found."];
        if (ctx.notes.length) lines.push(`Some checks could not run: ${ctx.notes.map((n) => n.check.toLowerCase()).join(", ")}.`);
        return lines;
    }
    return meaningful.slice(0, 3).map((f) => f.summary);
}

/**
 * Analyzes a raw e-mail (RFC 5322 / .eml, or a block of headers) and returns
 * findings, a verdict and extracted indicators. Runs in browsers and Node.js;
 * performs no network requests.
 */
export async function analyzeEmail(input: RawInput, options: AnalyzeOptions = {}): Promise<AnalysisResult> {
    const ctx = await buildContext(input, options);
    addRedirectTargets(ctx);

    const findings: Finding[] = [];
    for (const rule of RULES) {
        try {
            const f = rule.run(ctx);
            if (f) findings.push(f);
        } catch (error) {
            ctx.notes.push({ check: rule.meta.title, reason: `Rule ${rule.meta.id} failed: ${error instanceof Error ? error.message : String(error)}` });
        }
    }

    const sorted = sortFindings(findings);
    const score = riskScore(sorted);
    const verdict = verdictFor(sorted, score);

    return {
        schemaVersion: "1.0",
        engineVersion: ENGINE_VERSION,
        analyzedAt: ctx.now.toISOString(),
        verdict,
        verdictLabel: VERDICT_LABELS[verdict],
        riskScore: score,
        summary: summarize(sorted, ctx),
        findings: sorted,
        message: ctx.message,
        identity: {
            fromDomain: ctx.fromDomain,
            fromOrgDomain: ctx.fromOrg,
            replyToDomains: ctx.replyToDomains,
            returnPathDomain: ctx.returnPathDomain,
            freemail: ctx.freemailSender,
            brand: brandOwningHost(ctx.fromDomain)?.name ?? null,
        },
        authentication: ctx.auth,
        delivery: { hops: ctx.hops },
        links: ctx.links,
        attachments: ctx.attachments,
        bodyHtml: ctx.html,
        indicators: indicators(ctx),
        coverage: coverage(ctx),
    };
}
