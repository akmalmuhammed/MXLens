import { DetectionContext, DetectionResult, Detector } from "./Detector";
import { TyposquattingDetector } from "./rules/Typosquatting";
import { DisplayNameSpoofingDetector } from "./rules/DisplayNameSpoofing";
import { ContentUrgencyDetector } from "./rules/ContentUrgency";
import { ReplyToMismatchDetector } from "./rules/ReplyToMismatch";
import { IpUrlDetector } from "./rules/IpUrlDetector";
import { OpenRedirectDetector } from "./rules/OpenRedirect";
import { SpellingGrammarDetector } from "./rules/SpellingGrammar"; // Disabled caused build error
import { SemanticIntentDetector } from "./rules/SemanticIntentDetector";

export class DetectionPipeline {
    private detectors: Detector[] = [];

    constructor() {
        // Register Core Detectors
        this.detectors.push(new TyposquattingDetector());
        this.detectors.push(new DisplayNameSpoofingDetector());
        this.detectors.push(new ReplyToMismatchDetector());
        this.detectors.push(new ContentUrgencyDetector());
        this.detectors.push(new IpUrlDetector());
        this.detectors.push(new OpenRedirectDetector());
        // this.detectors.push(new SpellingGrammarDetector()); // Disabled

        // AI Detector (POC)
        this.detectors.push(new SemanticIntentDetector());
    }

    public async run(context: DetectionContext): Promise<{ results: DetectionResult[], totalPenalty: number }> {
        const results: DetectionResult[] = [];
        let totalPenalty = 0;

        for (const detector of this.detectors) {
            try {
                const result = await detector.detect(context);
                if (result && result.triggered) {
                    results.push(result);
                    totalPenalty += result.penalty;
                }
            } catch (e) {
                console.error(`Detector ${detector.id} failed:`, e);
            }
        }

        return { results, totalPenalty };
    }
}
