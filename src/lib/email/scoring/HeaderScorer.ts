import { NormalizedSignals, ScoreComponent } from "./types";
import { isKnownAuthServ } from "./Config";

export class HeaderScorer {
    static score(signals: NormalizedSignals): ScoreComponent {
        let score = 100;
        const penalties = [];

        // DMARC
        if (signals.dmarcResult === "fail") {
            score -= 50;
            penalties.push({ reason: "DMARC Fail", value: -50, critical: true, source: 'header' as const });
        } else if (signals.dmarcResult === "pass") {
            if (signals.dmarcPolicy === "quarantine") {
                score -= 5;
                penalties.push({ reason: "DMARC Policy is Weak (Quarantine)", value: -5, source: 'header' as const });
            } else if (signals.dmarcPolicy === "none") {
                score -= 15;
                penalties.push({ reason: "DMARC Policy is Monitoring Only (None)", value: -15, source: 'header' as const });
            }
        } else {
            score -= 15;
            penalties.push({ reason: "No DMARC Result Found", value: -15, source: 'header' as const });
        }

        // SPF
        if (signals.spfResult === "fail") {
            score -= 20;
            penalties.push({ reason: "SPF Fail", value: -20, source: 'header' as const });
        } else if (signals.spfResult === "softfail") {
            score -= 10;
            penalties.push({ reason: "SPF Softfail", value: -10, source: 'header' as const });
        } else if (signals.spfResult === "none" || signals.spfResult === "neutral") {
            score -= 10;
            penalties.push({ reason: "SPF Missing or Neutral", value: -10, source: 'header' as const });
        }

        // DKIM
        if (signals.dkimResult === "fail") {
            score -= 20;
            penalties.push({ reason: "DKIM Fail", value: -20, source: 'header' as const });
        } else if (signals.dkimResult === "none") {
            score -= 10;
            penalties.push({ reason: "DKIM Signature Missing", value: -10, source: 'header' as const });
        }
        // ARC OVERRIDE
        if (signals.arcResult === "pass") {
            // Restore only authentication penalties independently confirmed at origin.
            const spfPenalty = signals.arcOriginalSpf?.toLowerCase() === "pass"
                ? penalties.find(p => p.reason.includes("SPF"))
                : undefined;
            const dkimPenalty = signals.arcOriginalDkim?.toLowerCase() === "pass"
                ? penalties.find(p => p.reason.includes("DKIM"))
                : undefined;

            if (spfPenalty || dkimPenalty) {
                const refund = Math.abs((spfPenalty?.value || 0)) + Math.abs((dkimPenalty?.value || 0));
                score += refund;

                // Construct detailed reasoning
                let overrideMsg = "ARC Override: Forwarded message validated";
                if (signals.arcOriginalSpf || signals.arcOriginalDkim) {
                    const parts = [];
                    if (signals.arcOriginalSpf) parts.push(`Original SPF: ${signals.arcOriginalSpf.toUpperCase()}`);
                    if (signals.arcOriginalDkim) parts.push(`Original DKIM: ${signals.arcOriginalDkim.toUpperCase()}`);
                    if (parts.length > 0) overrideMsg += ` - ${parts.join(', ')}`;
                }

                penalties.push({
                    reason: overrideMsg,
                    value: refund,
                    warning: false,
                    source: 'header' as const
                });
            }
        } else if (signals.arcResult === "fail") {
            score -= 20;
            penalties.push({ reason: "ARC Chain Broken", value: -20, source: 'header' as const });
        }

        // ROUTING
        if (!signals.hasReceivedHeaders) {
            score -= 40;
            penalties.push({ reason: "Missing Received Headers", value: -40, source: 'header' as const });
        } else if (signals.receivedHopCount === 1) {
            score -= 10;
            penalties.push({ reason: "Suspicious Routing (Only 1 Hop)", value: -10, source: 'header' as const });
        }

        if (!signals.receivedTimestampsValid) {
            score -= 20;
            penalties.push({ reason: "Timestamp Anomaly (Out of Order)", value: -20, source: 'header' as const });
        }

        // METADATA
        if (signals.multipleAuthHeaders) {
            score -= 20;
            penalties.push({ reason: "Duplicate Authentication-Results", value: -20, source: 'header' as const });
        }

        // Most organizations run their own receiving servers, so an unrecognized
        // authserv-id is normal. It means the SPF/DKIM/DMARC results above cannot be
        // independently confirmed, which ConfidenceCalculator reflects; it is not
        // evidence of phishing on its own.
        if (signals.authservId && !isKnownAuthServ(signals.authservId)) {
            score -= 5;
            penalties.push({ reason: `Authentication results added by an unrecognized server (${signals.authservId}); not independently verified`, value: -5, source: 'header' as const });
        }

        return {
            score: Math.max(0, Math.min(100, score)),
            penalties
        };
    }
}
