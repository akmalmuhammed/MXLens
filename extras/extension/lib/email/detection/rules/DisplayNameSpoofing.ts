import { Detector, DetectionContext, DetectionResult } from "../Detector";

export class DisplayNameSpoofingDetector implements Detector {
    id = "display-name-spoofing";
    name = "Display Name Spoofing";
    description = "Detects when the display name contains an email address different from the actual sender.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['identity'];

    detect(context: DetectionContext): DetectionResult | null {
        const displayName = context.signals.fromDisplayName;
        const actualRawFrom = context.header.headers['From'] || "";

        if (!displayName) return null;

        // Pattern to find email-like strings inside Display Name
        // Case 1: "CEO <ceo@company.com>" <hacker@gmail.com>
        // We look for 'something@something.com' INSIDE the display name part

        // Simple regex for email extraction
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
        const emailsInName = displayName.match(emailRegex);

        if (emailsInName && emailsInName.length > 0) {
            const spoofedEmail = emailsInName[0].toLowerCase();
            // const actualEmailStart = actualRawFrom.indexOf('<'); // unused
            // const actualEmailClean = actualRawFrom.toLowerCase().includes(spoofedEmail); // unused

            // If the display name contains an email that is NOT the actual sender
            if (!actualRawFrom.toLowerCase().includes(spoofedEmail)) {
                return {
                    triggered: true,
                    score: 0.9,
                    penalty: -25,
                    name: this.name,
                    reason: `Display Name Spoofing: Sender identifies as "${spoofedEmail}" but sends from "${context.signals.fromDomain}"`,
                    metadata: { spoofed: spoofedEmail, actual: context.signals.fromDomain }
                };
            }
        }

        return null;
    }
}
