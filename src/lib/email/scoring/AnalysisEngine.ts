import { SignalNormalizer } from "./SignalNormalizer";
import { HeaderScorer } from "./HeaderScorer";
import { BodyScorer } from "./BodyScorer";
import { CrossContextScorer } from "./CrossContextScorer";
import { AttachmentScorer } from "./AttachmentScorer";
import { TrustCalculator } from "./TrustCalculator";
import { ConfidenceCalculator } from "./ConfidenceCalculator";
import { NormalizedSignals, ScoringResult, ValidationPenalty } from "./types";
import { DetectionPipeline } from "../detection/Pipeline";
import { AnalysisResult } from "../HeaderParser";

export class AnalysisEngine {
    static analyze(
        headerResult: AnalysisResult,
        emailBody: any | null,
        options: { checkBody: boolean; checkAttachments: boolean }
    ): { signals: NormalizedSignals; result: ScoringResult } {

        // 1. Normalize
        const signals = SignalNormalizer.normalize(headerResult, emailBody, options);

        // 2. Score Components
        const headerScore = HeaderScorer.score(signals);
        const bodyScore = BodyScorer.score(signals);
        const crossScore = CrossContextScorer.score(signals);
        const attachmentScore = AttachmentScorer.score(signals);

        // 3. Run Detection Pipeline (New V2 Logic)
        const pipeline = new DetectionPipeline();
        const { results: pipelineResults, totalPenalty: pipelinePenalty } = pipeline.run({
            header: headerResult,
            signals: signals,
            emailBody: emailBody,
            options: options
        });

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
            source: 'ml' // effectively "advanced logic"
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
                verdict
            }
        };
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
