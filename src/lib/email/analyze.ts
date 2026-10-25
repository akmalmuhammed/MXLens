import PostalMime from "postal-mime";
import { HeaderParser } from "./HeaderParser";
import { AnalysisEngine } from "./scoring/AnalysisEngine";
import type { NormalizedSignals, ScoringResult, ValidationPenalty } from "./scoring/types";

/**
 * Public engine API: analyze one raw RFC 822 message (.eml contents) and return a
 * JSON-safe summary. Runs unchanged in browsers and Node; makes no network calls.
 */

export interface AnalyzeOptions {
    /** Analyze the message body (links, forms, urgency, hidden text). Default true. */
    body?: boolean;
    /** Analyze attachments (types, macros, hashes). Default true. */
    attachments?: boolean;
}

export type Verdict = "clean" | "suspicious" | "malicious" | "unknown";

export interface Finding {
    reason: string;
    severity: "low" | "medium" | "high" | "critical";
    source: "header" | "body" | "cross" | "attachment" | "ml";
    impact: number;
    critical: boolean;
    tags?: string[];
}

export interface EmailAnalysis {
    verdict: Verdict;
    verdictLabel: ScoringResult["verdict"]["verdict"];
    /** 0 (safe) to 100 (dangerous). */
    riskScore: number;
    /** 100 - riskScore. */
    trustScore: number;
    confidence: {
        level: string;
        score: number;
    };
    reason: string;
    message: {
        subject: string;
        from: string;
        date: string;
    };
    findings: Finding[];
    signals: ReturnType<typeof summarizeSignals>;
    processingMs: number;
}

export async function analyzeEmail(rawEmail: string, options: AnalyzeOptions = {}): Promise<EmailAnalysis> {
    const start = Date.now();
    const [headerResult, email] = await Promise.all([
        HeaderParser.parse(rawEmail, { checkAttachments: options.attachments ?? true }),
        new PostalMime().parse(rawEmail)
    ]);
    const { signals, result } = await AnalysisEngine.analyze(headerResult, email, {
        checkBody: options.body ?? true,
        checkAttachments: options.attachments ?? true
    });

    const trustScore = clampScore(result.trust.score);

    return {
        verdict: normalizeVerdict(result.verdict.verdict),
        verdictLabel: result.verdict.verdict,
        riskScore: 100 - trustScore,
        trustScore,
        confidence: {
            level: result.confidence.level.toUpperCase(),
            score: clampScore(result.confidence.score)
        },
        reason: result.verdict.reason,
        message: {
            subject: email.subject ?? "",
            from: email.from ? formatAddress(email.from) : "",
            date: email.date ?? ""
        },
        findings: result.trust.penalties.map(mapFinding),
        signals: summarizeSignals(signals),
        processingMs: Date.now() - start
    };
}

function formatAddress(address: { name?: string; address?: string }) {
    if (address.name && address.address) return `${address.name} <${address.address}>`;
    return address.address || address.name || "";
}

function summarizeSignals(signals: NormalizedSignals) {
    return {
        authentication: {
            spf: signals.spfResult,
            dkim: signals.dkimResult,
            dmarc: signals.dmarcResult,
            dmarcPolicy: signals.dmarcPolicy,
            arc: signals.arcResult,
            authenticationResultsPresent: signals.authenticationResultsPresent
        },
        sender: {
            fromDomain: signals.fromDomain,
            replyToDomain: signals.replyToDomain,
            returnPathDomain: signals.returnPathDomain,
            brandInFrom: signals.brandInFrom,
            isFreeEmailProvider: signals.isFreeEmailProvider,
            isHighValueRole: signals.isHighValueRole
        },
        routing: {
            receivedHopCount: signals.receivedHopCount,
            hasReceivedHeaders: signals.hasReceivedHeaders,
            headerInjectionDetected: signals.headerInjectionDetected,
            receivedTimestampsValid: signals.receivedTimestampsValid
        },
        content: {
            bodyAnalysisEnabled: signals.bodyAnalysisEnabled,
            hasUrgency: signals.hasUrgency,
            hasCredentialHarvesting: signals.hasCredentialHarvesting,
            hasHiddenText: signals.hasHiddenText,
            hasHtmlForm: signals.hasHtmlForm,
            suspiciousLinks: signals.suspiciousLinks,
            rawIpLinks: signals.rawIpLinks,
            homoglyphDetected: signals.homoglyphDetected,
            extractedUrlCount: signals.extractedUrls.length,
            suspiciousUrlCount: signals.urlAnalysis.filter(url => url.riskScore > 0).length
        },
        attachments: {
            attachmentAnalysisEnabled: signals.attachmentAnalysisEnabled,
            count: signals.attachments.length,
            riskyCount: signals.attachments.filter(attachment =>
                attachment.isExecutable ||
                attachment.isMacroEnabled ||
                attachment.macroDetected ||
                attachment.hasDoubleExtension ||
                attachment.isMasquerading ||
                attachment.isScript ||
                attachment.isDiskImage ||
                attachment.isShortcut
            ).length,
            items: signals.attachments.map(attachment => ({
                extension: attachment.extension,
                size: attachment.size,
                sha256: attachment.sha256,
                isMasquerading: attachment.isMasquerading,
                hasDoubleExtension: attachment.hasDoubleExtension,
                isExecutable: attachment.isExecutable,
                isMacroEnabled: attachment.isMacroEnabled,
                macroDetected: attachment.macroDetected,
                isScript: attachment.isScript,
                isArchive: attachment.isArchive,
                isPasswordProtected: attachment.isPasswordProtected,
                isDiskImage: attachment.isDiskImage,
                isShortcut: attachment.isShortcut
            }))
        }
    };
}

function normalizeVerdict(label: ScoringResult["verdict"]["verdict"]): Verdict {
    if (label === "Likely Legitimate") return "clean";
    if (label === "Suspicious") return "suspicious";
    if (label === "High Risk") return "malicious";
    return "unknown";
}

function mapFinding(penalty: ValidationPenalty): Finding {
    const impact = Math.abs(penalty.value);

    return {
        reason: penalty.reason,
        severity: penalty.critical || impact >= 60 ? "critical" : impact >= 30 ? "high" : impact >= 10 ? "medium" : "low",
        source: penalty.source || "ml",
        impact,
        critical: Boolean(penalty.critical),
        tags: penalty.tags
    };
}

function clampScore(value: number) {
    return Math.max(0, Math.min(100, Math.round(value)));
}
