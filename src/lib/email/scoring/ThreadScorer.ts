import { NormalizedSignals, ScoreComponent } from "./types";

export class ThreadScorer {
    static score(signals: NormalizedSignals): ScoreComponent {
        let score = 100;
        const penalties = [];

        // Thread Hijacking / Fake Reply Detection
        // A "Reply" or "Forward" (Re:, Fwd:) MUST have In-Reply-To or References headers.

        const subject = signals.subject ? signals.subject.trim().toLowerCase() : "";
        // English, German (AW/WG), Nordic (SV/VS/VB), Dutch (Antw/Doorst), French (TR/RE),
        // Italian (R/RIF/I), Spanish (RV), Polish (ODP/PD), Chinese (回复/转发), "Re[2]:" forms.
        const isReplyOrForward = /^(?:re|fwd?|aw|wg|sv|vs|vb|antw|doorst|tr|rif|rv|odp|pd|回复|回覆|答复|转发|轉寄)(?:\[\d+\])?\s*[:：]/i.test(subject);
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
