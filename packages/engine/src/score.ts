import type { Finding, Severity, Verdict } from "./types.ts";

export const SEVERITY_ORDER: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };

export const THRESHOLDS = { malicious: 55, suspicious: 25 } as const;

export const VERDICT_LABELS: Record<Verdict, string> = {
    malicious: "Likely phishing",
    suspicious: "Suspicious",
    clean: "No strong indicators",
};

/**
 * Combines finding weights with a noisy-OR: each finding is treated as an
 * independent chance the message is malicious. Scores stay within 0–100, adding
 * a weak signal never outweighs a strong one, and order does not matter.
 */
export function riskScore(findings: Finding[]): number {
    let clean = 1;
    for (const f of findings) clean *= 1 - Math.min(Math.max(f.weight, 0), 95) / 100;
    return Math.round((1 - clean) * 100);
}

export function verdictFor(findings: Finding[], score: number): Verdict {
    if (score >= THRESHOLDS.malicious || findings.some((f) => f.severity === "critical")) return "malicious";
    if (score >= THRESHOLDS.suspicious || findings.some((f) => f.severity === "high")) return "suspicious";
    return "clean";
}

export function sortFindings(findings: Finding[]): Finding[] {
    return [...findings].sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] || b.weight - a.weight || a.ruleId.localeCompare(b.ruleId));
}
