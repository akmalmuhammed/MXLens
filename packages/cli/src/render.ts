import type { AnalysisResult, Severity, Verdict } from "@mxlens/engine";
import { defang } from "@mxlens/engine";

const CODES = { reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m", red: "\x1b[31m", yellow: "\x1b[33m", green: "\x1b[32m", cyan: "\x1b[36m", gray: "\x1b[90m" };

function paint(on: boolean) {
    return (code: keyof typeof CODES, text: string) => (on ? CODES[code] + text + CODES.reset : text);
}

const VERDICT_COLOR: Record<Verdict, keyof typeof CODES> = { malicious: "red", suspicious: "yellow", clean: "green" };
const SEVERITY_COLOR: Record<Severity, keyof typeof CODES> = { critical: "red", high: "red", medium: "yellow", low: "cyan", info: "gray" };

export function renderTerminal(result: AnalysisResult, { color, quiet }: { color: boolean; quiet: boolean }): string {
    const c = paint(color);
    const bar = "█".repeat(Math.round(result.riskScore / 5)).padEnd(20, "░");
    const head = `${c(VERDICT_COLOR[result.verdict], c("bold", result.verdictLabel.toUpperCase()))}  ${c("gray", bar)} ${result.riskScore}/100`;
    if (quiet) return head;

    const lines: string[] = [head, ""];
    for (const s of result.summary) lines.push(`  ${s}`);

    const m = result.message;
    lines.push("", c("bold", "Message"));
    if (m.subject) lines.push(`  Subject   ${m.subject}`);
    if (m.from) lines.push(`  From      ${m.from.name ? m.from.name + " " : ""}<${m.from.address}>`);
    if (m.replyTo.length) lines.push(`  Reply-To  ${m.replyTo.map((r) => r.address).join(", ")}`);
    const a = result.authentication;
    const authState = (r: string) => (r === "pass" ? c("green", r) : r === "fail" || r === "softfail" ? c("red", r) : c("gray", r));
    lines.push(`  Auth      SPF ${authState(a.spf.result)}  DKIM ${authState(a.dkim[0]?.result ?? "none")}  DMARC ${authState(a.dmarc.result)}${a.trust === "assumed" ? c("gray", "  (unverified header)") : ""}`);

    if (result.findings.length) {
        lines.push("", c("bold", `Findings (${result.findings.length})`));
        for (const f of result.findings) {
            lines.push(`  ${c(SEVERITY_COLOR[f.severity], f.severity.toUpperCase().padEnd(8))} ${c("dim", f.ruleId)}  ${f.summary}`);
            for (const e of f.evidence.slice(0, 3)) lines.push(c("gray", `              ${e.label}: ${e.value}${e.note ? ` (${e.note})` : ""}`));
            if (f.attack.length) lines.push(c("gray", `              ATT&CK: ${f.attack.map((t) => `${t.id} ${t.name}`).join("; ")}`));
        }
    }

    const ind = result.indicators;
    const iocLines = [
        ...ind.urls.map((u) => `  URL     ${defang(u)}`),
        ...ind.domains.map((d) => `  Domain  ${defang(d)}`),
        ...ind.ips.map((i) => `  IP      ${i}`),
        ...ind.sha256.map((h) => `  SHA256  ${h}`),
    ];
    if (iocLines.length) {
        lines.push("", c("bold", "Indicators") + c("gray", " (defanged)"));
        lines.push(...iocLines.slice(0, 20));
    }

    if (result.coverage.skipped.length) {
        lines.push("", c("gray", "Not checked"));
        for (const s of result.coverage.skipped) lines.push(c("gray", `  ${s.check}: ${s.reason}`));
    }
    return lines.join("\n");
}
