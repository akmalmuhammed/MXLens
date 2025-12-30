import { NormalizedSignals, ScoreComponent } from "./types";

export class HomographDetector {
    static detect(text: string): { detected: boolean; reason?: string } {
        if (!text) return { detected: false };

        // 1. Mixed Script Detection (Cyrillic/Greek/Latin mixing)
        // Common attack: 'a' (Cyrillic U+0430) vs 'a' (Latin U+0061)

        // Regex for non-Latin characters often used in spoofing
        // Cyrillic, Greek, etc.
        const nonLatin = /[^\u0000-\u007F]/;

        if (nonLatin.test(text)) {
            // If it has non-latin chars, check if they are mixed with Latin in a suspicious way
            // or if it's Punycode (xn--)

            // Punycode in display text? suspicious if not decoded
            if (text.startsWith("xn--")) {
                return { detected: true, reason: "Punycode (xn--) detected in display text" };
            }

            // Invisible characters check
            // Zero-width space, joiner, non-joiner, etc.
            const invisibleChars = /[\u200B-\u200D\uFEFF]/;
            if (invisibleChars.test(text)) {
                return { detected: true, reason: "Invisible/Zero-width characters detected" };
            }

            // Mixed Script Heuristic (Simplified)
            // If we have both Latin and Cyrillic in the same string, it's highly suspicious for a domain/email
            const hasLatin = /[a-zA-Z]/.test(text);
            const hasCyrillic = /[\u0400-\u04FF]/.test(text);

            if (hasLatin && hasCyrillic) {
                return { detected: true, reason: "Mixed Script (Latin + Cyrillic) Detected - Potential Homograph Attack" };
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
