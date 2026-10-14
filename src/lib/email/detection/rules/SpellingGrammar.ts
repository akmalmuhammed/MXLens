import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { getFirstHeaderValue } from "../../parser/HeaderUtils";

export class SpellingGrammarDetector implements Detector {
    id = "spelling-grammar-simple";
    name = "Spelling & Grammar (Simple)";
    description = "Detects basic spelling & grammar anomalies using heuristics.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['content'];

    // Common typos in phishing/spam (Top 50)
    private commonTypos = [
        "teh", "recieve", "account", "u pdate", "verif y", "immediatly", "becuase",
        "unti", "custome r", "bankof", "pay pal", "mic rosoft", "securty", "loggin",
        "pasword", "infomation", "suppor t", "kindley", "belive", "truely"
    ];

    detect(context: DetectionContext): DetectionResult | null {
        if (!context.options.checkBody || !context.emailBody) return null;

        const text = (context.emailBody.text || "").toLowerCase();

        // 1. Check for broken words / spaced-out keywords
        // "V e r i f y" -> spam filter evasion
        let evasionCount = 0;
        const evasionRegex = /\b([a-z])\s([a-z])\s([a-z])\s([a-z])\b/g;
        const matches = text.match(evasionRegex);
        if (matches) evasionCount = matches.length;

        if (evasionCount > 1) {
            return {
                triggered: true,
                score: 0.7,
                penalty: -10,
                name: "Spam Keyword Evasion",
                reason: `Detected spaced-out words (e.g. "V e r i f y") typical of spam filters evasion.`,
            };
        }

        // 2. Simple Typo List Scannning
        let typoCount = 0;
        const foundTypos: string[] = [];
        this.commonTypos.forEach(typo => {
            if (text.includes(typo)) {
                typoCount++;
                foundTypos.push(typo);
            }
        });

        if (typoCount >= 2) {
            return {
                triggered: true,
                score: 0.5,
                penalty: -5,
                name: "Poor Spelling",
                reason: `Detected common phishing typos: "${foundTypos.join('", "')}"`,
            };
        }

        // 3. Excessive Capitalization (in Subject)
        const subject = getFirstHeaderValue(context.header.headers, 'Subject');
        const subjectUpper = subject.replace(/[^A-Z]/g, "").length;
        const subjectLen = subject.length;

        if (subjectLen > 10 && (subjectUpper / subjectLen > 0.7)) {
            return {
                triggered: true,
                score: 0.4,
                penalty: -5,
                name: "Aggressive Capitalization",
                reason: "Subject line is mostly uppercase.",
            };
        }

        return null;
    }
}
