import { NormalizedSignals, ScoreComponent } from "./types";

export class HomographDetector {
    static detect(text: string): { detected: boolean; reason?: string } {
        if (!text) return { detected: false };

        // 1. Mixed Script Detection (Cyrillic/Greek/Latin mixing)
        // Common attack: 'a' (Cyrillic U+0430) vs 'a' (Latin U+0061)

        // Punycode is plain ASCII, so check it before the non-ASCII gate (it used to be
        // unreachable). Any label may be encoded, not just the first: login.xn--pypal-4ve.com
        if (/(?:^|\.)xn--/i.test(text)) {
            return { detected: true, reason: "Punycode (xn--) label detected - encoded Unicode domain" };
        }

        if (/[^\u0000-\u007F]/.test(text)) {
            // Zero-width and bidirectional control characters
            if (/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/.test(text)) {
                return { detected: true, reason: "Invisible/Zero-width or bidirectional control characters detected" };
            }

            // Latin mixed with a confusable script (Cyrillic, Greek, Armenian, Cherokee)
            const hasLatin = /[a-zA-Z]/.test(text);
            const confusable = /[\u0370-\u03FF\u0400-\u04FF\u0500-\u052F\u0530-\u058F\u13A0-\u13FF]/.test(text);
            if (hasLatin && confusable) {
                return { detected: true, reason: "Mixed Script (Latin + Cyrillic/Greek/Armenian) Detected - Potential Homograph Attack" };
            }
        }

        return { detected: false };
    }

    static score(signals: NormalizedSignals): ScoreComponent {
        let score = 100;
        const penalties = [];

        // Check From Address
        const fromCheck = this.detect(signals.fromDomain);
        if (fromCheck.detected) {
            score -= 90;
            penalties.push({
                reason: `Homograph Attack in From Domain: ${fromCheck.reason}`,
                value: -90,
                critical: true,
                source: 'header' as const
            });
        }

        // Check Return-Path
        const rpCheck = this.detect(signals.returnPathDomain);
        if (rpCheck.detected) {
            score -= 50; // slightly less critical as it might be backend infrastructure
            penalties.push({
                reason: `Homograph Attack in Return-Path: ${rpCheck.reason}`,
                value: -50,
                source: 'header' as const
            });
        }

        // Check Links (if extracted)
        // We won't penalize global score aggressively for one bad link unless we check all
        // This is handled by Link Analysis usually, but we can do a quick check here

        return {
            score: Math.max(0, score),
            penalties
        };
    }
}
