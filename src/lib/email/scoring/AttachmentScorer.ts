import { NormalizedSignals } from "./types";

export class AttachmentScorer {
    static score(signals: NormalizedSignals): { totalPenalty: number; penalties: any[] } {
        if (!signals.attachmentAnalysisEnabled || signals.attachments.length === 0) {
            return { totalPenalty: 0, penalties: [] };
        }

        let totalPenalty = 0;
        const penalties = [];

        for (const att of signals.attachments) {
            let basePenalty = 0;

            // CRITICAL: Masquerading File (extension vs magic mismatch)
            if (att.isMasquerading) {
                basePenalty = 100;
                penalties.push({ reason: `Masquerading File Detected: ${att.filename} is likely ${att.magicType?.toUpperCase()}`, value: -100, critical: true, source: 'attachment' as const });
            }

            // CRITICAL: Malicious Script Content
            if (att.dangerousFunctions && att.dangerousFunctions.length > 0) {
                basePenalty = Math.max(basePenalty, 90);
                penalties.push({ reason: `Malicious Script Content: ${att.filename} contains [${att.dangerousFunctions.join(', ')}]`, value: -90, critical: true, source: 'attachment' as const });
            }

            // CRITICAL: Hidden Macro in safe-looking file
            if (att.macroDetected) {
                if (!att.isMacroEnabled) {
                    basePenalty = Math.max(basePenalty, 90);
                    penalties.push({ reason: `Hidden Macro Detected: ${att.filename} contains macros but has safe extension`, value: -90, critical: true, source: 'attachment' as const });
                } else {
                    basePenalty = Math.max(basePenalty, 50);
                    if (basePenalty === 50) penalties.push({ reason: `Active Macros Detected: ${att.filename}`, value: -50, warning: true, source: 'attachment' as const });
                }
            }

            // CRITICAL: Disk Image (ISO/IMG) - Common malware delivery
            if (att.isDiskImage) {
                basePenalty = Math.max(basePenalty, 80);
                penalties.push({ reason: `Disk Image Attachment: ${att.filename} - commonly used to bypass security`, value: -80, critical: true, source: 'attachment' as const });
            }

            // CRITICAL: Shortcut File (.lnk) with suspicious target
            if (att.isShortcut) {
                if (att.lnkTarget) {
                    basePenalty = Math.max(basePenalty, 95);
                    penalties.push({ reason: `Malicious Shortcut: ${att.filename} targets "${att.lnkTarget}"`, value: -95, critical: true, source: 'attachment' as const });
                } else {
                    basePenalty = Math.max(basePenalty, 75);
                    penalties.push({ reason: `Shortcut Attachment: ${att.filename} - can execute arbitrary commands`, value: -75, critical: true, source: 'attachment' as const });
                }
            }

            // HIGH: Password Protected Archive
            if (att.isPasswordProtected) {
                basePenalty = Math.max(basePenalty, 70);
                penalties.push({ reason: `Password-Protected Archive: ${att.filename} - content cannot be scanned`, value: -70, warning: true, source: 'attachment' as const });
            }

            // HIGH: Nested Dangerous Files in Archive
            if (att.nestedFiles && att.nestedFiles.length > 0) {
                basePenalty = Math.max(basePenalty, 85);
                penalties.push({ reason: `Dangerous Files in Archive: ${att.filename} contains [${att.nestedFiles.join(', ')}]`, value: -85, critical: true, source: 'attachment' as const });
            }

            // CRITICAL: Right-to-left override disguises the real extension
            if (att.hasBidiOverride) {
                basePenalty = Math.max(basePenalty, 70);
                penalties.push({ reason: `Filename Uses Right-to-Left Override: ${att.filename.replace(/[\u202A-\u202E\u2066-\u2069\u200E\u200F]/g, "[RLO]")} hides its real extension`, value: -70, critical: true, source: 'attachment' as const });
            }

            // MEDIUM: Double Extension
            if (att.hasDoubleExtension) {
                basePenalty = Math.max(basePenalty, 70);
                if (basePenalty === 70) penalties.push({ reason: `Double Extension: ${att.filename}`, value: -70, critical: true, source: 'attachment' as const });
            } else if (att.isExecutable) {
                basePenalty = Math.max(basePenalty, 60);
                if (basePenalty === 60) penalties.push({ reason: `Executable Attachment: ${att.filename}`, value: -60, critical: true, source: 'attachment' as const });
            } else if (att.isScript) {
                basePenalty = Math.max(basePenalty, 60);
                if (basePenalty === 60) penalties.push({ reason: `Script Attachment: ${att.filename}`, value: -60, critical: true, source: 'attachment' as const });
            } else if (att.isMacroEnabled && !att.macroDetected) {
                basePenalty = Math.max(basePenalty, 30);
                if (basePenalty === 30) penalties.push({ reason: `Macro-Enabled Extension: ${att.filename}`, value: -30, source: 'attachment' as const });
            }

            // BONUS: Urgency + Dangerous Attachment
            if (signals.hasUrgency && basePenalty > 0) {
                basePenalty += 20;
                penalties.push({ reason: "Urgency + Dangerous Attachment", value: -20, source: 'attachment' as const });
            }

            // MITIGATION: Strong Auth reduces macro risk
            if (att.isMacroEnabled && signals.dmarcResult === "pass" && signals.dmarcPolicy === "reject") {
                const mitigation = 15;
                basePenalty -= mitigation;
                penalties.push({ reason: "Strong Auth Mitigated Macro Risk", value: +15, warning: false, source: 'attachment' as const });
            }

            totalPenalty += basePenalty;
        }

        return { totalPenalty, penalties };
    }
}
