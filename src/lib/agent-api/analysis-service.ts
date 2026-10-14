import PostalMime from "postal-mime";
import { HeaderParser } from "@/lib/email/HeaderParser";
import { AnalysisEngine } from "@/lib/email/scoring/AnalysisEngine";
import type { NormalizedSignals, ScoringResult, ValidationPenalty } from "@/lib/email/scoring/types";
import type { EmailAnalysisOptions, ResolvedEmailInput } from "./ingestion";

export interface AgentFinding {
    reason: string;
    severity: "low" | "medium" | "high" | "critical";
    source: "header" | "body" | "cross" | "attachment" | "ml";
    impact: number;
    critical: boolean;
    tags?: string[];
}

export interface PublicAnalysisResult {
    analysisId?: string;
    verdict: "clean" | "suspicious" | "malicious" | "unknown";
    verdictLabel: ScoringResult["verdict"]["verdict"];
    riskScore: number;
    trustScore: number;
    confidence: {
        level: string;
        score: number;
    };
    reason: string;
    findings: AgentFinding[];
    signals: ReturnType<typeof summarizeSignals>;
    processingMs: number;
    source: {
        type: ResolvedEmailInput["sourceType"];
        filename?: string;
        externalId?: string;
        clientReferenceId?: string;
    };
}

export async function analyzeResolvedEmail(
    input: ResolvedEmailInput,
    options: EmailAnalysisOptions
): Promise<PublicAnalysisResult> {
    const start = Date.now();
    const headerResultPromise = HeaderParser.parse(input.rawEmail);
    const emailPromise = new PostalMime().parse(input.rawEmail);
    const [headerResult, email] = await Promise.all([headerResultPromise, emailPromise]);
    const { signals, result } = await AnalysisEngine.analyze(headerResult, email, {
        checkBody: options.analyzeBody,
        checkAttachments: options.analyzeAttachments
    });

    const trustScore = clampScore(result.trust.score);
    const riskScore = clampScore(100 - trustScore);

    return {
        verdict: normalizeVerdict(result.verdict.verdict),
        verdictLabel: result.verdict.verdict,
        riskScore,
        trustScore,
        confidence: {
            level: result.confidence.level.toUpperCase(),
            score: clampScore(result.confidence.score)
        },
        reason: result.verdict.reason,
        findings: result.trust.penalties.map(mapFinding),
        signals: summarizeSignals(signals),
        processingMs: Date.now() - start,
        source: {
            type: input.sourceType,
            filename: input.filename,
            externalId: input.externalId,
            clientReferenceId: input.clientReferenceId
        }
    };
}

export function toAnalysisVerdict(verdict: PublicAnalysisResult["verdict"]) {
    switch (verdict) {
        case "clean":
            return "CLEAN";
        case "suspicious":
            return "SUSPICIOUS";
        case "malicious":
            return "MALICIOUS";
        default:
            return "UNKNOWN";
    }
}

export function summarizeForBatch(result: PublicAnalysisResult) {
    return {
        analysisId: result.analysisId,
        verdict: result.verdict,
        verdictLabel: result.verdictLabel,
        riskScore: result.riskScore,
        confidence: result.confidence,
        findingCount: result.findings.length,
        processingMs: result.processingMs,
        source: result.source
    };
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

function normalizeVerdict(label: ScoringResult["verdict"]["verdict"]): PublicAnalysisResult["verdict"] {
    if (label === "Likely Legitimate") return "clean";
    if (label === "Suspicious") return "suspicious";
    if (label === "High Risk") return "malicious";
    return "unknown";
}

function mapFinding(penalty: ValidationPenalty): AgentFinding {
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
