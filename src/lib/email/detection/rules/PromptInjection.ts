import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { extractCommentText, extractHiddenText } from "../../analysis/HtmlText";

/**
 * Indirect prompt injection aimed at AI email assistants (Copilot, Gemini, ...).
 * Attackers hide instructions in the HTML (invisible to the reader, visible to the model)
 * so the assistant's summary shows a fake security alert, a phone number or a link.
 * Visible-only matches score lower: security newsletters legitimately quote such phrases.
 */
export class PromptInjectionDetector implements Detector {
    id = "ai-prompt-injection";
    name = "AI Assistant Prompt Injection";
    description = "Detects instructions aimed at AI email assistants, especially when hidden from the reader.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['content'];

    private patterns: { id: string; re: RegExp }[] = [
        { id: "override", re: /\b(?:ignore|disregard|forget)\s+(?:all\s+|any\s+)?(?:of\s+)?(?:the\s+|your\s+)?(?:previous|prior|above|earlier|preceding|other)\s+(?:instructions?|prompts?|rules|context|messages?)/i },
        { id: "role", re: /\b(?:you\s+are|you're|act\s+as)\s+(?:now\s+)?(?:an?\s+)?(?:ai|llm|large\s+language\s+model|language\s+model|(?:email\s+)?assistant|copilot|gemini|chatgpt)\b/i },
        { id: "addressed", re: /\b(?:copilot|gemini|chatgpt|claude|ai\s+assistant|dear\s+assistant)\s*[,:]?\s+(?:you\s+(?:must|should|have\s+to|need\s+to)|please\s+(?:include|add|append|insert|say|tell|summari[sz]e|respond|output|forward|send|reply)|(?:include|add|append|insert|output|respond|forward|send|reply|summari[sz]e)\b)/i },
        { id: "summary-hook", re: /\b(?:when|if|while)\s+(?:you\s+(?:are\s+)?)?summari[sz](?:e|ing)\b|\b(?:in|at\s+the\s+(?:end|top)\s+of)\s+(?:your|the)\s+(?:summary|response|answer|reply)\b/i },
        { id: "control-tokens", re: /<\|?(?:system|im_start|im_end)\|?>|\[\/?(?:INST|SYS)\]|<\/?(?:system|instructions?|assistant|admin)>|\bsystem\s+prompt\b/i },
        { id: "concealment", re: /\bdo\s+not\s+(?:mention|reveal|disclose|show)\s+(?:this|these)\s+(?:instructions?|message|prompt)/i }
    ];

    detect(context: DetectionContext): DetectionResult | null {
        const html = context.emailBody?.html || "";
        const hidden = extractHiddenText(html).map(s => s.text);
        const comments = extractCommentText(html);
        const hiddenText = [...hidden, comments].join(" ");
        const visibleText = context.signals.visibleText || context.emailBody?.text || "";

        const hiddenHits = this.hits(hiddenText);
        const visibleHits = this.hits(visibleText);

        if (hiddenHits.length > 0) {
            return {
                triggered: true,
                score: 0.9,
                penalty: -40,
                name: this.name,
                reason: `Hidden text contains instructions aimed at an AI email assistant (${hiddenHits.join(", ")}). The reader cannot see it, but Copilot/Gemini-style summarizers read it and can be steered into showing fake alerts or links.`,
                metadata: { hiddenHits, visibleHits }
            };
        }
        if (visibleHits.length >= 2) {
            return {
                triggered: true,
                score: 0.5,
                penalty: -15,
                name: this.name,
                reason: `Message text addresses an AI assistant with instructions (${visibleHits.join(", ")}).`,
                metadata: { visibleHits }
            };
        }
        return null;
    }

    private hits(text: string): string[] {
        if (!text) return [];
        return this.patterns.filter(p => p.re.test(text)).map(p => p.id);
    }
}
