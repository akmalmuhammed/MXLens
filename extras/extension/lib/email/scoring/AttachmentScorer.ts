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

            if (att.isMasquerading) {
                basePenalty = 100;
                penalties.push({ reason: `Masquerading File Detected: ${att.filename} is likely ${att.magicType?.toUpperCase()}`, value: -100, critical: true, source: 'attachment' as const });
            }

            // Phase 2: Content Analysis Penalties
            if (att.dangerousFunctions && att.dangerousFunctions.length > 0) {
                basePenalty = Math.max(basePenalty, 90);
                penalties.push({ reason: `Malicious Script Content: ${att.filename} contains [${att.dangerousFunctions.join(', ')}]`, value: -90, critical: true, source: 'attachment' as const });
            }

            if (att.macroDetected) {
                if (!att.isMacroEnabled) {
                    // Hidden Macro (e.g. in .docx or .xlsx)
                    basePenalty = Math.max(basePenalty, 90);
                    penalties.push({ reason: `Hidden Macro Detected: ${att.filename} contains macros but has safe extension`, value: -90, critical: true, source: 'attachment' as const });
                } else {
                    // Confirmed Macro (e.g. in .docm) - Higher risk than just "extension says so"
                    basePenalty = Math.max(basePenalty, 50);
                    if (basePenalty === 50) penalties.push({ reason: `Active Macros Detected: ${att.filename}`, value: -50, warning: true, source: 'attachment' as const });
                }
            }

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
                // Asserted macro extension but no macros found? Or just fallback.
                basePenalty = Math.max(basePenalty, 30);
                if (basePenalty === 30) penalties.push({ reason: `Macro-Enabled Extension: ${att.filename}`, value: -30, source: 'attachment' as const });
            }

            if (signals.hasUrgency && basePenalty > 0) {
                basePenalty += 20;
                penalties.push({ reason: "Urgency + Dangerous Attachment", value: -20, source: 'attachment' as const });
            }

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
