import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { env, pipeline } from "@xenova/transformers";

// Skip local checks for models since we run in browser
env.allowLocalModels = false;
env.useBrowserCache = true;

// Singleton to hold the model instance so we don't reload it every time
class SentimentModel {
    static instance: any = null;
    static loading = false;

    static async getClassifier() {
        if (this.instance) return this.instance;
        if (this.loading) {
            // Wait for loading to finish
            while (this.loading) {
                await new Promise(r => setTimeout(r, 100));
            }
            return this.instance;
        }

        this.loading = true;
        try {
            // Load a lightweight model fine-tuned for sentiment/emotion
            // 'Xenova/distilbert-base-uncased-finetuned-sst-2-english' is good for general sentiment
            // Negative sentiment often correlates with fear/urgency/coercion in phishing
            console.log("Loading AI Model...");
            this.instance = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
            console.log("AI Model Loaded");
        } catch (e) {
            console.error("Failed to load AI model", e);
        } finally {
            this.loading = false;
        }
        return this.instance;
    }
}

export class SemanticIntentDetector implements Detector {
    id = "semantic_intent";
    name = "Semantic Intent Analysis (AI)";
    description = "Uses a local DistilBERT model to detect negative sentiment, urgency, and coercion patterns in the email body.";
    tags: Detector['tags'] = ['content', 'identity'];

    async detect(context: DetectionContext): Promise<DetectionResult | null> {
        if (!context.options.checkBody || !context.signals.bodyAnalysisEnabled) return null;
        if (!context.emailBody || !context.emailBody.text) return null;

        const text = context.emailBody.text.slice(0, 1000); // Analyze first 1000 chars (header & opening) for performance

        try {
            const classifier = await SentimentModel.getClassifier();
            if (!classifier) return null;

            // Output format: [{ label: 'POSITIVE', score: 0.99 }, { label: 'NEGATIVE', score: 0.01 }]
            const output = await classifier(text);
            const result = output[0]; // { label: 'NEGATIVE', score: 0.99 }

            // Logic: Phishing often uses negative sentiment (fear, urgency, threats)
            // "Your account will be suspended" -> Negative
            if (result.label === 'NEGATIVE' && result.score > 0.9) {
                return {
                    triggered: true,
                    score: 0.8,
                    penalty: -25,
                    name: this.name,
                    reason: `AI detected strong negative sentiment or urgency (${Math.round(result.score * 100)}% confidence).`,
                    metadata: {
                        model: 'distilbert-sst-2',
                        confidence: result.score,
                        sentiment: 'NEGATIVE'
                    }
                };
            }
        } catch (e) {
            console.warn("AI Detection failed:", e);
        }

        return null; // Safe or inconclusive
    }
}
