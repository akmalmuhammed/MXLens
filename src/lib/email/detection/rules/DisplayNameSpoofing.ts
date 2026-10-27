import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { getFirstHeaderValue } from "../../parser/HeaderUtils";

export class DisplayNameSpoofingDetector implements Detector {
    id = "display-name-spoofing";
    name = "Display Name Spoofing";
    description = "Detects when the display name contains an email address different from the actual sender.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['identity'];

    detect(context: DetectionContext): DetectionResult | null {
        const displayName = context.signals.fromDisplayName;
        const actualRawFrom = getFirstHeaderValue(context.header.headers, 'From');

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

        // Microsoft Q1 2026: sender names stuffed with URLs/tracking hosts
        // ("awstrack.me", "zoom.nl") to borrow their reputation in the inbox preview.
        const domainInName = displayName.toLowerCase().match(/\b(?:https?:\/\/)?((?:[a-z0-9-]+\.)+[a-z]{2,})\b/);
        const from = context.signals.fromDomain.toLowerCase();
        if (domainInName && from) {
            const claimed = domainInName[1];
            const claimedOrg = claimed.split(".").slice(-2).join(".");
            const fromOrg = from.split(".").slice(-2).join(".");
            if (claimedOrg !== fromOrg && !/^(?:e\.g|i\.e|n\.a|a\.m|p\.m)$/.test(claimed)) {
                return {
                    triggered: true,
                    score: 0.6,
                    penalty: -10,
                    name: "Domain in Display Name",
                    reason: `Display name shows the domain "${claimed}" but the message is from ${from}.`,
                    metadata: { claimed, actual: from }
                };
            }
        }

        return null;
    }
}
