import { NormalizedSignals, ScoreComponent, ScoringResult } from "./types";

export class TrustCalculator {
    static calculate(
        headerResult: ScoreComponent,
        bodyResult: ScoreComponent,
        crossResult: ScoreComponent,
        attachmentResult: { totalPenalty: number; penalties: any[] },
        signals: NormalizedSignals
    ): ScoringResult['trust'] {

        let finalScore = 0;
        const allPenalties = [
            ...headerResult.penalties,
            ...bodyResult.penalties,
            ...crossResult.penalties
        ];

        if (signals.bodyAnalysisEnabled) {
            finalScore =
                (headerResult.score * 0.55) +
                (bodyResult.score * 0.35) +
                (crossResult.score * 0.10);
        } else {
            finalScore =
                (headerResult.score * 0.85) +
                (crossResult.score * 0.15);

            allPenalties.push({
                reason: "Body Analysis Disabled (Limited Verdict)",
                value: 0,
                warning: true,
                source: 'body' as const // or generic
            });
        }

        if (attachmentResult.totalPenalty > 0) {
            finalScore -= attachmentResult.totalPenalty;
            allPenalties.push(...attachmentResult.penalties);
        }

        // Authentication Trust Boost: Dampen body penalties when authentication is PERFECT
        // DMARC Pass + p=reject means the sender is cryptographically verified
        const isPerfectAuth = signals.dmarcResult === 'pass' && signals.dmarcPolicy === 'reject';

        if (isPerfectAuth && signals.bodyAnalysisEnabled) {
            // Reduce body penalty impact by 50% for verified senders
            // This prevents legitimate financial/gov emails from being flagged
            const bodyPenaltyReduction = (100 - bodyResult.score) * 0.5;
            finalScore += bodyPenaltyReduction;

            if (bodyPenaltyReduction > 0) {
                allPenalties.push({
                    reason: "Auth Trust Boost: DMARC p=reject verified sender (+dampened content penalties)",
                    value: Math.round(bodyPenaltyReduction),
                    source: 'header' as const
                });
            }
        }

        // Weak Link Rule: Cap score when body content is dangerous
        // EXCEPTION: Skip for perfectly authenticated senders
        if (signals.bodyAnalysisEnabled && bodyResult.score < 40 && !isPerfectAuth) {
            const cap = 45;
            if (finalScore > cap) {
                allPenalties.push({
                    reason: "Weak Link Rule: Dangerous Content Overrides Strong Headers",
                    value: -(finalScore - cap),
                    critical: true,
                    source: 'cross' as const
                });
                finalScore = cap;
            }
        }

        finalScore = Math.max(0, Math.min(100, finalScore));

        return {
            score: Math.round(finalScore),
            penalties: allPenalties,
            components: {
                header: headerResult.score,
                body: bodyResult.score,
                cross: crossResult.score
            }
        };
    }
}
