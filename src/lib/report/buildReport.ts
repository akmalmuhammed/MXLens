import type { AnalysisResult, EmailHop } from "@/lib/email/HeaderParser";
import { getFirstHeaderValue } from "@/lib/email/parser/HeaderUtils";
import { isKnownAuthServ } from "@/lib/email/scoring/Config";
import { organizationalDomain } from "@/lib/email/analysis/Domain";
import type { AttachmentSignal, NormalizedSignals, ScoringResult, ValidationPenalty } from "@/lib/email/scoring/types";

/**
 * Turns raw engine output into the analyst report the UI renders: one risk score,
 * de-duplicated findings grouped by what they are about, and the evidence that
 * supports them. Pure and side-effect free so it can be unit tested.
 */

export type Verdict = "malicious" | "suspicious" | "clean" | "unknown";
export type Severity = "critical" | "high" | "medium" | "low";
export type Tone = "pass" | "fail" | "warn" | "neutral";
export type FindingCategory = "authentication" | "sender" | "content" | "links" | "attachments" | "routing";

export interface Finding {
    id: string;
    title: string;
    severity: Severity;
    category: FindingCategory;
    /** Points this finding removed from the trust score (always positive). */
    impact: number;
}

export interface Mitigation {
    id: string;
    title: string;
    /** Points this factor added back to the trust score. */
    impact: number;
}

export interface AuthCheck {
    name: "SPF" | "DKIM" | "DMARC" | "ARC";
    status: string;
    tone: Tone;
    detail: string;
    explanation: string;
}

export interface AuthOrigin {
    /** Where the earliest evaluation was read from. */
    source: string;
    spf: string | null;
    dkim: string | null;
    dmarc: string | null;
    dmarcAction: string | null;
    spfIp: string | null;
    finalSpfIp: string | null;
    /** The chain is not cryptographically verified (ARC absent or failed). */
    unverified: boolean;
    /** The earliest evaluation failed but the final result passed for a different IP. */
    masked: boolean;
}

export interface ReceiverHandling {
    scl: number | null;
    authAs: string | null;
    compauth: string | null;
    compauthReason: string | null;
    filteringBypassed: boolean;
}

export interface IdentityRow {
    label: "From" | "Reply-To" | "Return-Path";
    value: string;
    domain: string | null;
    /** Whether this domain matches the From domain; null when not applicable. */
    matchesFrom: boolean | null;
}

export interface IdentityCheck {
    label: string;
    tone: Tone;
}

export interface LinkIndicator {
    url: string;
    host: string;
    flags: string[];
    risky: boolean;
}

export interface IpIndicator {
    ip: string;
    isPrivate: boolean;
    context: string;
}

export interface AttachmentRow {
    filename: string;
    extension: string;
    size: number;
    sha256: string;
    flags: string[];
    risky: boolean;
}

export interface Hop {
    from: string;
    by: string;
    ip: string | null;
    time: string;
    delaySeconds: number;
    notes: string[];
}

export interface Report {
    verdict: Verdict;
    verdictLabel: string;
    headline: string;
    /** 0 (no concerns) to 100 (dangerous). The inverse of the engine's trust score. */
    risk: number;
    confidence: { level: "High" | "Medium" | "Low"; score: number; factors: string[] };
    message: {
        subject: string;
        from: string;
        fromName: string;
        to: string;
        date: string;
        messageId: string;
    };
    scope: { body: boolean; attachments: boolean };
    findings: Finding[];
    mitigations: Mitigation[];
    actions: string[];
    auth: {
        checks: AuthCheck[];
        authservId: string | null;
        authservKnown: boolean;
        resultsPresent: boolean;
        /** Earliest recorded evaluation (ARC i=1 / gateway header), when present. */
        origin: AuthOrigin | null;
        /** How Exchange Online / EOP handled the message, when its headers are present. */
        receiver: ReceiverHandling | null;
    };
    identity: { rows: IdentityRow[]; checks: IdentityCheck[] };
    links: LinkIndicator[];
    ips: IpIndicator[];
    domains: string[];
    attachments: AttachmentRow[];
    hops: Hop[];
    headerNotes: { key: string; value: string; explanation?: string }[];
}

const VERDICT_BY_LABEL: Record<ScoringResult["verdict"]["verdict"], Verdict> = {
    "High Risk": "malicious",
    "Suspicious": "suspicious",
    "Likely Legitimate": "clean",
    "Unknown": "unknown",
};

const VERDICT_LABEL: Record<Verdict, string> = {
    malicious: "High risk",
    suspicious: "Suspicious",
    clean: "Likely legitimate",
    unknown: "Inconclusive",
};

export function buildReport(header: AnalysisResult, signals: NormalizedSignals, scoring: ScoringResult): Report {
    const verdict = VERDICT_BY_LABEL[scoring.verdict.verdict] ?? "unknown";
    const risk = clamp(100 - scoring.trust.score);

    const { findings, mitigations } = splitPenalties(scoring.trust.penalties);

    return {
        verdict,
        verdictLabel: VERDICT_LABEL[verdict],
        headline: scoring.verdict.reason,
        risk,
        confidence: {
            level: scoring.confidence.level,
            score: clamp(scoring.confidence.score),
            factors: scoring.confidence.factors.map(f => f.reason),
        },
        message: {
            subject: firstHeader(header, "Subject") || signals.subject || "(no subject)",
            from: firstHeader(header, "From"),
            fromName: signals.fromDisplayName,
            to: firstHeader(header, "To"),
            date: firstHeader(header, "Date"),
            messageId: firstHeader(header, "Message-ID").replace(/[<>]/g, ""),
        },
        scope: { body: signals.bodyAnalysisEnabled, attachments: signals.attachmentAnalysisEnabled },
        findings,
        mitigations,
        actions: buildActions(verdict, findings),
        auth: buildAuth(header, signals),
        identity: buildIdentity(header, signals),
        links: buildLinks(signals),
        ips: buildIps(header),
        domains: buildDomains(signals),
        attachments: signals.attachments.map(toAttachmentRow),
        hops: buildHops(header.hops),
        headerNotes: (header.xHeaders ?? []).filter(x => x.key.toLowerCase() !== "x-mailer" || x.value),
    };
}

// ---------------------------------------------------------------- findings

export function severityOf(penalty: Pick<ValidationPenalty, "value" | "critical">): Severity {
    const impact = Math.abs(penalty.value);
    if (penalty.critical || impact >= 50) return "critical";
    if (impact >= 30) return "high";
    if (impact >= 10) return "medium";
    return "low";
}

export function categoryOf(penalty: ValidationPenalty): FindingCategory {
    const reason = penalty.reason.toLowerCase();
    if (penalty.source === "attachment" || penalty.tags?.includes("malware")) return "attachments";
    if (penalty.tags?.includes("link") || /\b(url|link|redirect|shortener|qr)\b/.test(reason)) return "links";
    if (penalty.tags?.includes("identity") || penalty.source === "cross") return "sender";
    if (penalty.tags?.includes("auth")) return "authentication";
    if (penalty.source === "header") {
        if (/\b(spf|dkim|dmarc|arc|authentication|authserv)\b/.test(reason)) return "authentication";
        if (/\b(reply-to|return-path|display name|impersonat|lookalike|homoglyph|sender)\b/.test(reason)) return "sender";
        return "routing";
    }
    return "content";
}

function splitPenalties(penalties: ValidationPenalty[]) {
    const findings: Finding[] = [];
    const mitigations: Mitigation[] = [];
    const seen = new Set<string>();

    penalties.forEach((penalty, index) => {
        const key = penalty.reason.trim().toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        if (penalty.value > 0) {
            mitigations.push({ id: `m${index}`, title: penalty.reason, impact: penalty.value });
        } else if (penalty.value < 0) {
            findings.push({
                id: `f${index}`,
                title: penalty.reason,
                severity: severityOf(penalty),
                category: categoryOf(penalty),
                impact: Math.abs(penalty.value),
            });
        }
    });

    const rank: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    findings.sort((a, b) => rank[a.severity] - rank[b.severity] || b.impact - a.impact);
    return { findings, mitigations };
}

// ---------------------------------------------------------------- actions

function buildActions(verdict: Verdict, findings: Finding[]): string[] {
    const has = (category: FindingCategory) => findings.some(f => f.category === category && f.severity !== "low");
    const actions: string[] = [];

    if (verdict === "malicious") {
        actions.push("Do not click links, open attachments or reply.");
        actions.push("Quarantine or delete the message and block the sender domain if it is not a business contact.");
        actions.push("Search other mailboxes for the same sender, subject or links and remove copies.");
        if (has("links")) actions.push("If anyone clicked a link and entered credentials, reset their password and revoke sessions.");
        if (has("attachments")) actions.push("If an attachment was opened, isolate the device and start incident response.");
    } else if (verdict === "suspicious") {
        actions.push("Do not act on requests in the message until the sender is verified.");
        actions.push("Verify through a known channel (phone number or chat), not by replying.");
        if (has("links")) actions.push("Check link destinations before visiting them.");
        if (has("authentication")) actions.push("Check whether the message was forwarded or sent through a mailing list, which can break authentication.");
    } else if (verdict === "clean") {
        actions.push("No technical threats were found. Still verify unusual payment or password requests out of band.");
    } else {
        actions.push("Not enough evidence for a verdict. Enable body and attachment analysis or review the raw headers.");
    }

    return actions;
}

// ---------------------------------------------------------------- authentication

function toneOf(status: string): Tone {
    const s = status.toLowerCase();
    if (s === "pass") return "pass";
    if (s === "fail" || s === "permerror") return "fail";
    if (s === "softfail" || s === "temperror" || s === "neutral" || s === "policy") return "warn";
    return "neutral";
}

function buildAuth(header: AnalysisResult, signals: NormalizedSignals): Report["auth"] {
    const arcStatus = header.arc?.status ?? signals.arcResult;
    const arcDetail = [
        signals.arcOriginalSpf ? `original spf=${signals.arcOriginalSpf}` : "",
        signals.arcOriginalDkim ? `original dkim=${signals.arcOriginalDkim}` : "",
    ].filter(Boolean).join("; ");

    const dmarcPolicy = signals.dmarcPolicy !== "unknown" ? ` Published policy: p=${signals.dmarcPolicy}.` : "";

    return {
        checks: [
            authCheck("SPF", header.auth.spf.status, header.auth.spf.details, header.auth.spf.explanation),
            authCheck("DKIM", header.auth.dkim.status, header.auth.dkim.details, header.auth.dkim.explanation),
            authCheck(
                "DMARC",
                header.auth.dmarc.status,
                header.auth.dmarc.details,
                `${header.auth.dmarc.explanation ?? ""}${dmarcPolicy}`.trim(),
                // An inferred "bestguesspass" is not a pass; do not show it as neutral/OK.
                header.auth.dmarc.bestGuess ? "warn" : undefined
            ),
            authCheck(
                "ARC",
                arcStatus,
                arcDetail || (header.arc?.details ?? []).join("; "),
                arcStatus === "pass"
                    ? "A forwarding server vouched for the original authentication results."
                    : arcStatus === "fail"
                        ? "The ARC chain is broken; forwarded results cannot be trusted."
                        : "No ARC chain. Expected unless the message was forwarded or sent through a list."
            ),
        ],
        authservId: signals.authservId,
        authservKnown: signals.authservId ? isKnownAuthServ(signals.authservId) : false,
        resultsPresent: signals.authenticationResultsPresent,
        origin: header.originAuth
            ? {
                source: header.originAuth.source,
                spf: header.originAuth.spf ?? null,
                dkim: header.originAuth.dkim ?? null,
                dmarc: header.originAuth.dmarc ?? null,
                dmarcAction: header.originAuth.dmarcAction ?? null,
                spfIp: header.originAuth.spfIp ?? null,
                finalSpfIp: header.originAuth.finalSpfIp ?? null,
                unverified: header.originAuth.unverified,
                masked: header.originAuth.masked,
            }
            : null,
        receiver: header.exchange
            ? {
                scl: header.exchange.scl ?? null,
                authAs: header.exchange.authAs ?? null,
                compauth: header.exchange.compauth ?? null,
                compauthReason: header.exchange.compauthReason ?? null,
                filteringBypassed: header.exchange.filteringBypassed,
            }
            : null,
    };
}

function authCheck(name: AuthCheck["name"], status: string, detail: string, explanation?: string, tone?: Tone): AuthCheck {
    return { name, status: status || "none", tone: tone ?? toneOf(status || "none"), detail: detail || "", explanation: explanation || "" };
}

// ---------------------------------------------------------------- identity

function buildIdentity(header: AnalysisResult, signals: NormalizedSignals): Report["identity"] {
    const from = signals.fromDomain.toLowerCase();
    const sameOrg = (domain: string | null) => (domain ? organizationalDomain(domain) === organizationalDomain(from) : null);

    const replyTo = firstHeader(header, "Reply-To");
    const returnPath = firstHeader(header, "Return-Path").replace(/[<>]/g, "");

    const rows: IdentityRow[] = [{ label: "From", value: firstHeader(header, "From"), domain: from || null, matchesFrom: null }];
    if (replyTo) rows.push({ label: "Reply-To", value: replyTo, domain: signals.replyToDomain, matchesFrom: sameOrg(signals.replyToDomain) });
    if (returnPath) rows.push({ label: "Return-Path", value: returnPath, domain: signals.returnPathDomain || null, matchesFrom: sameOrg(signals.returnPathDomain || null) });

    const checks: IdentityCheck[] = [];
    const replyRow = rows.find(r => r.label === "Reply-To");
    if (replyRow) checks.push({ label: replyRow.matchesFrom ? "Replies go to the sender's domain" : "Replies go to a different domain", tone: replyRow.matchesFrom ? "pass" : "fail" });
    const bounceRow = rows.find(r => r.label === "Return-Path");
    if (bounceRow) checks.push({ label: bounceRow.matchesFrom ? "Bounce address matches the sender" : "Bounce address uses a different domain", tone: bounceRow.matchesFrom ? "pass" : "warn" });
    if (signals.isFreeEmailProvider) checks.push({ label: "Sent from a free email provider", tone: signals.isHighValueRole ? "fail" : "warn" });
    if (signals.brandInFrom) checks.push({ label: `Display name or address mentions ${signals.brandInFrom}`, tone: "warn" });
    if (signals.homoglyphDetected) checks.push({ label: "Lookalike characters in a domain", tone: "fail" });
    if (header.impersonationAlert) checks.push({ label: header.impersonationAlert, tone: "fail" });

    return { rows, checks };
}

/** Rough organizational domain (last two labels, three for common ccTLD second levels). */
export { organizationalDomain };

// ---------------------------------------------------------------- indicators

function hostOf(url: string): string {
    try {
        return new URL(url).hostname.toLowerCase();
    } catch {
        return "";
    }
}

const SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly", "rebrand.ly", "cutt.ly", "shorturl.at"];

function buildLinks(signals: NormalizedSignals): LinkIndicator[] {
    const byUrl = new Map<string, LinkIndicator>();

    for (const url of signals.extractedUrls) {
        const host = hostOf(url);
        const flags: string[] = [];
        if (SHORTENERS.includes(host)) flags.push("URL shortener");
        if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) flags.push("Raw IP address");
        if (url.startsWith("http://")) flags.push("Not HTTPS");
        byUrl.set(url, { url, host, flags, risky: flags.length > 0 });
    }

    for (const analysis of signals.urlAnalysis ?? []) {
        const host = hostOf(analysis.href);
        const existing = byUrl.get(analysis.href) ?? { url: analysis.href, host, flags: [], risky: false };
        if (analysis.isMismatched) existing.flags.push(`Text shows ${analysis.display}`);
        if (analysis.isSubdomainTrick) existing.flags.push("Subdomain trick");
        if (analysis.isLookalike) existing.flags.push("Lookalike domain");
        for (const detail of analysis.details) if (!existing.flags.includes(detail)) existing.flags.push(detail);
        existing.risky = existing.risky || analysis.riskScore > 0;
        byUrl.set(analysis.href, existing);
    }

    return [...byUrl.values()].sort((a, b) => Number(b.risky) - Number(a.risky));
}

export function isPrivateIp(ip: string): boolean {
    if (ip.includes(":")) return /^(::1|f[cd]|fe[89ab])/i.test(ip);
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || (a === 100 && b >= 64 && b <= 127);
}

function buildIps(header: AnalysisResult): IpIndicator[] {
    return header.artifacts
        .filter(a => a.type === "ip")
        .map(a => ({ ip: a.value, isPrivate: isPrivateIp(a.value), context: (a.label ?? "").replace(/^Hop: /, "Relay ") }));
}

function buildDomains(signals: NormalizedSignals): string[] {
    const domains = new Set<string>();
    for (const d of [signals.fromDomain, signals.replyToDomain, signals.returnPathDomain]) if (d) domains.add(d.toLowerCase());
    for (const url of signals.extractedUrls) {
        const host = hostOf(url);
        if (host && !/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) domains.add(host);
    }
    return [...domains];
}

function toAttachmentRow(attachment: AttachmentSignal): AttachmentRow {
    const flags: string[] = [];
    if (attachment.isExecutable) flags.push("Executable");
    if (attachment.isScript) flags.push("Script");
    if (attachment.hasDoubleExtension) flags.push("Double extension");
    if (attachment.isMasquerading) flags.push(`Really ${attachment.magicType?.toUpperCase() ?? "another type"}`);
    if (attachment.macroDetected) flags.push("Contains macros");
    else if (attachment.isMacroEnabled) flags.push("Macro-enabled type");
    if (attachment.isDiskImage) flags.push("Disk image");
    if (attachment.isShortcut) flags.push(attachment.lnkTarget ? `Shortcut to ${attachment.lnkTarget}` : "Shortcut");
    if (attachment.isPasswordProtected) flags.push("Password-protected archive");
    else if (attachment.isArchive) flags.push("Archive");
    if (attachment.dangerousFunctions.length > 0) flags.push(`Calls ${attachment.dangerousFunctions.slice(0, 3).join(", ")}`);
    return {
        filename: attachment.filename,
        extension: attachment.extension,
        size: attachment.size,
        sha256: attachment.sha256,
        flags,
        risky: flags.some(f => f !== "Archive"),
    };
}

// ---------------------------------------------------------------- delivery path

function buildHops(hops: EmailHop[]): Hop[] {
    // Received headers are newest first; show the path in the order it happened.
    return [...hops]
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
        .map(hop => ({
            from: hop.from.replace(/;$/, ""),
            by: hop.by.replace(/;$/, ""),
            ip: hop.ip ?? null,
            time: hop.time,
            delaySeconds: Math.max(0, hop.delay || 0),
            notes: hop.annotations ?? [],
        }));
}

// ---------------------------------------------------------------- helpers

function firstHeader(header: AnalysisResult, name: string): string {
    return getFirstHeaderValue(header.headers, name).replace(/\s+/g, " ").trim();
}

function clamp(value: number) {
    return Math.max(0, Math.min(100, Math.round(value)));
}

/** Makes an indicator safe to paste into tickets and chat (hxxp, [.]). */
export function defang(value: string): string {
    return value
        .replace(/^http(s?):\/\//i, (_, s) => `hxxp${s}://`)
        .replace(/\./g, "[.]");
}

/**
 * Defangs hostnames and IPv4 addresses that appear inside prose (finding titles),
 * without touching ordinary text such as "e.g." or version numbers.
 */
export function defangInline(text: string): string {
    return text
        .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, m => m.replace(/\./g, "[.]"))
        .replace(/\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}\b/gi, m => m.replace(/\./g, "[.]"));
}

/** Plain-text summary for tickets and chat. */
export function reportToText(report: Report, options: { defang: boolean } = { defang: true }): string {
    const d = (v: string) => (options.defang ? defang(v) : v);
    const lines = [
        `MXLens verdict: ${report.verdictLabel.toUpperCase()} (risk ${report.risk}/100, confidence ${report.confidence.level.toLowerCase()})`,
        `Subject: ${report.message.subject}`,
        `From: ${report.message.from}`,
    ];
    if (report.message.date) lines.push(`Date: ${report.message.date}`);
    const auth = report.auth.checks.map(c => `${c.name} ${c.status}`).join(", ");
    lines.push(`Authentication: ${auth}`);
    const origin = report.auth.origin;
    if (origin && (origin.masked || origin.spf === "softfail" || origin.spf === "fail" || origin.dmarc === "fail")) {
        const parts = [
            origin.spf ? `SPF ${origin.spf}${origin.spfIp ? ` for ${d(origin.spfIp)}` : ""}` : "",
            origin.dmarc ? `DMARC ${origin.dmarc}${origin.dmarcAction ? ` (${origin.dmarcAction})` : ""}` : "",
        ].filter(Boolean).join(", ");
        lines.push(`Earliest evaluation (${origin.source}${origin.unverified ? ", unverified" : ""}): ${parts}${origin.masked ? " - final result hides this" : ""}`);
    }
    if (report.findings.length) {
        lines.push("", "Findings:");
        for (const f of report.findings) lines.push(`- [${f.severity}] ${options.defang ? defangInline(f.title) : f.title}`);
    }
    const iocs = [
        ...report.domains.map(d),
        ...report.ips.filter(i => !i.isPrivate).map(i => d(i.ip)),
        ...report.links.map(l => d(l.url)),
        ...report.attachments.map(a => `${a.filename} sha256:${a.sha256}`),
    ];
    if (iocs.length) {
        lines.push("", "Indicators:");
        for (const ioc of iocs) lines.push(`- ${ioc}`);
    }
    return lines.join("\n");
}
