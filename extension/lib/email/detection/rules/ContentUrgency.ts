import { Detector, DetectionContext, DetectionResult } from "../Detector";

export class ContentUrgencyDetector implements Detector {
    id = "content-urgency";
    name = "Urgency & Pressure";
    description = "Detects high-pressure language often used in BEC and phishing.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['content'];

    private urgencyKeywords = [
        "urgent", "immediate action", "suspend", "terminate", "24 hours",
        "account blocked", "verification required", "unauthorized access",
        "security alert", "click below", "password expiry", "final notice"
    ];

    private paymentKeywords = [
        "invoice", "wire transfer", "payment", "bank details", "swift copy",
        "purchase order", "overdue", "remittance", "payroll", "direct deposit"
    ];

    detect(context: DetectionContext): DetectionResult | null {
        if (!context.options.checkBody || !context.emailBody) return null;

        const text = (context.emailBody.text + " " + context.header.headers['Subject']).toLowerCase();

        let urgencyCount = 0;
        let paymentCount = 0;
        const matches: string[] = [];

        this.urgencyKeywords.forEach(kw => {
            if (text.includes(kw)) {
                urgencyCount++;
                if (matches.length < 3) matches.push(kw);
            }
        });

        this.paymentKeywords.forEach(kw => {
            if (text.includes(kw)) {
                paymentCount++;
                if (matches.length < 5) matches.push(kw);
            }
        });

        // Heuristics
        if (urgencyCount >= 2 && paymentCount >= 1) {
            return {
                triggered: true,
                score: 0.7,
                penalty: -15,
                name: "Urgent Payment Request",
                reason: `Detected high-pressure language related to payments: "${matches.join('", "')}"`,
            };
        }

        if (urgencyCount >= 3) {
            return {
                triggered: true,
                score: 0.5,
                penalty: -10,
                name: "High Urgency Language",
                reason: `Detected multiple urgency triggers: "${matches.join('", "')}"`,
            };
        }

        return null;
    }
}
