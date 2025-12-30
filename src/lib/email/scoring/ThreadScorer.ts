import { NormalizedSignals, ScoreComponent } from "./types";

export class ThreadScorer {
    static score(signals: NormalizedSignals): ScoreComponent {
        let score = 100;
        const penalties = [];

        // Thread Hijacking / Fake Reply Detection
        // A "Reply" or "Forward" (Re:, Fwd:) MUST have In-Reply-To or References headers.

        const subject = signals.subject ? signals.subject.trim().toLowerCase() : "";
        const isReplyOrForward = subject.startsWith("re:") || subject.startsWith("fwd:") || subject.startsWith("fw:") || subject.startsWith("aw:"); // aw: German
        const hasThreadingHeaders = !!signals.inReplyTo || !!signals.references;

        if (isReplyOrForward && !hasThreadingHeaders) {
            // High Penalty: This is a classic indicator of mass phishing campaigns 
            // trying to trick users into thinking it's an existing conversation.
            score -= 75;
            penalties.push({
                reason: "Fake Reply Detected: Subject indicates a reply/forward but threading headers are missing",
                value: -75,
                critical: true,
                warning: true,
                source: 'header' as const
            });
        }

        return {
            score: Math.max(0, score),
            penalties
        };
    }
}
