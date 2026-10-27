import { ThreadScorer } from "./ThreadScorer";
import { ImpersonationScorer } from "./ImpersonationScorer";
import { HomographDetector } from "./HomographDetector";
import { SignalNormalizer } from "./SignalNormalizer";
import { HeaderScorer } from "./HeaderScorer";
import { BodyScorer } from "./BodyScorer";
import { CrossContextScorer } from "./CrossContextScorer";
import { AttachmentScorer } from "./AttachmentScorer";
import { TrustCalculator } from "./TrustCalculator";
import { ConfidenceCalculator } from "./ConfidenceCalculator";
import { NormalizedSignals, ParsedEmailBody, ScoringResult, ValidationPenalty } from "./types";
import { DetectionPipeline } from "../detection/Pipeline";
import type { DetectionResult, DetectionTag } from "../detection/Detector";
import { AnalysisResult } from "../HeaderParser";
import { expandEmbeddedMessages } from "../analysis/EmbeddedMessages";

export class AnalysisEngine {
    static async analyze(
        headerResult: AnalysisResult,
        emailBody: ParsedEmailBody | null,
        options: { checkBody: boolean; checkAttachments: boolean }
    ): Promise<{ signals: NormalizedSignals; result: ScoringResult }> {

        // 0. Open attached emails so their lure, links and images are analyzed too.
        let embedded: Awaited<ReturnType<typeof expandEmbeddedMessages>> | null = null;
        if (emailBody && (options.checkBody || options.checkAttachments)) {
            embedded = await expandEmbeddedMessages(emailBody);
            emailBody = embedded.body;
        }

        // 1. Normalize
        const signals = await SignalNormalizer.normalize(headerResult, emailBody, options);
        signals.embeddedMessages = embedded?.embedded ?? [];
        signals.outerVisibleText = embedded?.outerVisibleText ?? signals.visibleText;

        // 2. Score Components
        const headerScore = HeaderScorer.score(signals);
        const bodyScore = BodyScorer.score(signals);
        const crossScore = CrossContextScorer.score(signals);
        const attachmentScore = AttachmentScorer.score(signals);

        // Advanced Phishing Scorers (New)
        const threadScore = ThreadScorer.score(signals);
        const impersonationScore = ImpersonationScorer.score(signals);
        const homographScore = HomographDetector.score(signals);

        // Update signals with homograph detection result for downstream logic
        if (homographScore.penalties.length > 0) {
            signals.homoglyphDetected = true;
        }

        // 3. Run Detection Pipeline (New V2 Logic)
        const pipeline = new DetectionPipeline();
        const { results: pipelineResults, totalPenalty: pipelinePenalty, performance: pipelineTelemetry } = await pipeline.run({
            header: headerResult,
            signals: signals,
            emailBody: emailBody || undefined,
            attachments: emailBody?.attachments || [], // Pass raw attachments for scanning
            options: options
        });

        // Merge Advanced Scores into Header/Cross Components
        // We do this to avoid changing the TrustCalculator signature while still applying penalties
        headerScore.score = Math.min(headerScore.score, threadScore.score, impersonationScore.score, homographScore.score);
        headerScore.penalties.push(...threadScore.penalties, ...impersonationScore.penalties, ...homographScore.penalties);



        // 4. Aggregate Trust (Legacy + Pipeline)
        const trustResult = TrustCalculator.calculate(
            headerScore,
            bodyScore,
            crossScore,
            attachmentScore,
            signals
        );

        // Merge Pipeline Penalties into Trust Score
        // Ensure score doesn't drop below 0
        trustResult.score = Math.max(0, trustResult.score + pipelinePenalty);

        // Map pipeline results to penalties format and add to trust result
        const newPenalties: ValidationPenalty[] = pipelineResults.map(r => ({
            reason: r.reason,
            value: r.penalty,
            critical: r.score > 0.8,
            source: this.mapDetectionSource(r),
            tags: r.tags
        }));
        trustResult.penalties.push(...newPenalties);

        // 5. Calculate Confidence
        const confidenceResult = ConfidenceCalculator.calculate(signals);

        // 6. Determine Final Verdict Label
        const verdict = this.determineVerdict(trustResult.score, confidenceResult.score, signals, trustResult);

        return {
            signals,
            result: {
                trust: trustResult,
                confidence: confidenceResult,
                verdict,
                performance: pipelineTelemetry
            }
        };
    }

    private static mapDetectionSource(result: DetectionResult): NonNullable<ValidationPenalty['source']> {
        const tags: DetectionTag[] = result.tags || [];

        if (tags.includes('auth')) return 'header';
        if (tags.includes('identity')) return 'cross';
        if (tags.includes('content') || tags.includes('link')) return 'body';
        if (tags.includes('malware')) return 'attachment';

        return 'ml';
    }

    private static determineVerdict(
        trustScore: number,
        confidenceScore: number,
        signals: NormalizedSignals,
        trustResult: ScoringResult['trust']
    ): ScoringResult['verdict'] {

        // ============ CRITICAL OVERRIDES ============

        // 1. DMARC Fail Enforcement
        if (signals.dmarcResult === "fail" && signals.dmarcPolicy === "reject") {
            return {
                verdict: "High Risk",
                reason: "Critical: DMARC Enforcement Failure (p=reject)",
                overridden: true
            };
        }

        // 2. Disguised Malware
        const hasCriticalAttachment = signals.attachments.some(att =>
            att.hasDoubleExtension ||
            (att.isExecutable && trustScore < 70)
        );
        if (hasCriticalAttachment) {
            return {
                verdict: "High Risk",
                reason: "Critical: Disguised Malware Detected",
                overridden: true
            };
        }

        // 3. Active Credential Theft
        if (signals.hasCredentialHarvesting &&
            (signals.hasHtmlForm || signals.suspiciousLinks) &&
            signals.homoglyphDetected) {
            return {
                verdict: "High Risk",
                reason: "Critical: Active Credential Phishing Detected",
                overridden: true
            };
        }

        // 4. Weak Link Rule (already handled in TrustCalculator via scoring cap, but label reinforcement)
        // If the Trust Score was capped by Weak Link, ensure High Risk
        if (trustResult.penalties.some(p => p.reason.includes("Weak Link"))) {
            return {
                verdict: "High Risk",
                reason: "High Risk: Dangerous Content Overrides Strong Headers",
                overridden: true
            };
        }

        // ============ SCORE-BASED VERDICT ============
        let label: ScoringResult['verdict']['verdict'] = "Unknown";
        let reason = "";

        if (trustScore >= 80) {
            label = "Likely Legitimate";
            reason = "Strong authentication and no significant threats found.";
        } else if (trustScore >= 50) {
            label = "Suspicious";
            reason = "Inconclusive signals or weak authentication.";
        } else {
            label = "High Risk";
            reason = "Significant threats or critical authentication failures.";
        }

        if (confidenceScore < 40) {
            reason += " (Low data confidence)";
        }

        return {
            verdict: label,
            reason,
            overridden: false
        };
    }
}
