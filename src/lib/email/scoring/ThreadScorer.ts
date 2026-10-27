import { NormalizedSignals, ScoreComponent } from "./types";

export class ThreadScorer {
    static score(signals: NormalizedSignals): ScoreComponent {
        let score = 100;
        const penalties = [];

        // Thread Hijacking / Fake Reply Detection
        // A "Reply" or "Forward" (Re:, Fwd:) MUST have In-Reply-To or References headers.

        const subject = signals.subject ? signals.subject.trim().toLowerCase() : "";
        // Reply prefixes only. Forwards (Fwd/FW/WG/TR/VB/RV/PD/转发...) normally carry no
        // In-Reply-To/References (Gmail and many clients never add them), so a forward
        // without threading headers is ordinary mail, not a fake thread.
        // English RE, German AW, Nordic SV, Finnish VS, Dutch Antw, Italian R/RIF,
        // Polish ODP, Portuguese RES, Turkish YNT, Chinese 回复/回覆/答复, and "Re[2]:" forms.
        const isReplyOrForward = /^(?:re|aw|sv|vs|antw|r|rif|odp|res|ynt|回复|回覆|答复)(?:\[\d+\])?\s*[:：]/i.test(subject);
        const hasThreadingHeaders = !!signals.inReplyTo || !!signals.references;

        if (isReplyOrForward && !hasThreadingHeaders) {
            // High Penalty: This is a classic indicator of mass phishing campaigns 
            // trying to trick users into thinking it's an existing conversation.
            score -= 75;
            penalties.push({
                reason: "Fake Reply Detected: Subject says it is a reply but the reply-threading headers (In-Reply-To/References) are missing",
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
