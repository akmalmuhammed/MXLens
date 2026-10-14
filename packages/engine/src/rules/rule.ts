import type { Context } from "../context.ts";
import type { AttackTechnique, Evidence, Finding, RuleMeta, Severity } from "../types.ts";

export const ATTACK = {
    phishing: { id: "T1566", name: "Phishing" },
    attachment: { id: "T1566.001", name: "Phishing: Spearphishing Attachment" },
    link: { id: "T1566.002", name: "Phishing: Spearphishing Link" },
    voice: { id: "T1566.004", name: "Phishing: Spearphishing Voice" },
    impersonation: { id: "T1656", name: "Impersonation" },
    masquerading: { id: "T1036", name: "Masquerading" },
    rtlo: { id: "T1036.002", name: "Masquerading: Right-to-Left Override" },
    doubleExtension: { id: "T1036.007", name: "Masquerading: Double File Extension" },
    userExecution: { id: "T1204.002", name: "User Execution: Malicious File" },
    maliciousLink: { id: "T1204.001", name: "User Execution: Malicious Link" },
    motw: { id: "T1553.005", name: "Subvert Trust Controls: Mark-of-the-Web Bypass" },
    smuggling: { id: "T1027.006", name: "Obfuscated Files or Information: HTML Smuggling" },
    obfuscation: { id: "T1027", name: "Obfuscated Files or Information" },
    vba: { id: "T1059.005", name: "Command and Scripting Interpreter: Visual Basic" },
    credentials: { id: "T1056.003", name: "Input Capture: Web Portal Capture" },
    lookalikeDomain: { id: "T1583.001", name: "Acquire Infrastructure: Domains" },
} satisfies Record<string, AttackTechnique>;

/** Default points per severity. Rules may pass a specific weight. */
export const SEVERITY_WEIGHT: Record<Severity, number> = { info: 0, low: 8, medium: 18, high: 32, critical: 48 };

export interface Rule {
    meta: RuleMeta;
    /** Returns at most one finding; multiple occurrences become evidence items. */
    run(ctx: Context): Finding | null;
}

export function finding(
    meta: RuleMeta,
    severity: Severity,
    summary: string,
    evidence: Evidence[],
    weight = SEVERITY_WEIGHT[severity],
): Finding {
    return {
        ruleId: meta.id,
        title: meta.title,
        category: meta.category,
        severity,
        weight,
        summary,
        evidence: evidence.slice(0, 25),
        attack: meta.attack,
    };
}
