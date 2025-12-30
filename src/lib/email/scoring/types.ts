export interface AttachmentSignal {
    filename: string;
    extension: string;
    size: number;
    sha256: string;                       // Calculated hash
    magicType: string | null;             // Detected file type from bytes
    isMasquerading: boolean;              // magicType !== extension
    hasDoubleExtension: boolean;          // e.g., invoice.pdf.exe
    isExecutable: boolean;                // .exe, .scr, .bat, .cmd
    isMacroEnabled: boolean;              // .docm, .xlsm, .pptm (Extension based)
    macroDetected: boolean;               // True if vbaProject.bin found in content
    isScript: boolean;                    // .js, .ps1, .vbs, .jar
    dangerousFunctions: string[];         // e.g. ["eval", "WScript.Shell"]
    // Phase 4: Enhanced Detection
    isArchive: boolean;                   // .zip, .rar, .7z, .tar
    isPasswordProtected: boolean;         // Archive requires password
    isDiskImage: boolean;                 // .iso, .img, .vhd, .dmg
    isShortcut: boolean;                  // .lnk, .url, .webloc
    lnkTarget?: string;                   // Extracted target path from .lnk
    nestedFiles?: string[];               // Files detected inside archives
}

export interface NormalizedSignals {
    spfResult: "pass" | "fail" | "softfail" | "none" | "neutral" | "temperror" | "permerror";
    dkimResult: "pass" | "fail" | "none" | "neutral" | "temperror" | "permerror";
    dmarcResult: "pass" | "fail" | "none" | "temperror" | "permerror";
    dmarcPolicy: "reject" | "quarantine" | "none" | "unknown";
    arcResult: "pass" | "fail" | "none" | "neutral" | "temperror" | "permerror";
    arcOriginalSpf: string | null;
    arcOriginalDkim: string | null;

    authenticationResultsPresent: boolean;
    multipleAuthHeaders: boolean;
    authservId: string | null;

    receivedHopCount: number;
    hasReceivedHeaders: boolean;
    headerInjectionDetected: boolean;
    receivedTimestampsValid: boolean;

    fromDomain: string;
    fromDisplayName: string;
    replyToDomain: string | null;
    returnPathDomain: string;

    // Threading Signals
    subject: string;
    inReplyTo: string | null;
    references: string | null;

    bodyAnalysisEnabled: boolean;
    hasUrgency: boolean;
    hasCredentialHarvesting: boolean;
    hasHiddenText: boolean;
    hasHtmlForm: boolean;
    suspiciousLinks: boolean;
    rawIpLinks: boolean;
    extractedUrls: string[];
    homoglyphDetected: boolean;
    brandInBody: string | null;

    attachmentAnalysisEnabled: boolean;
    attachments: AttachmentSignal[];

    brandInFrom: string | null;
    isFreeEmailProvider: boolean;
    isHighValueRole: boolean;
}

export interface ValidationPenalty {
    reason: string;
    value: number; // Negative number
    critical?: boolean;
    warning?: boolean;
    source?: 'header' | 'body' | 'cross' | 'attachment' | 'ml';
}

export interface ScoreComponent {
    score: number;
    penalties: ValidationPenalty[];
}

export interface ScoringResult {
    trust: {
        score: number;
        penalties: ValidationPenalty[];
        components: {
            header: number;
            body: number;
            cross: number;
        };
    };
    confidence: {
        score: number;
        level: "High" | "Medium" | "Low";
        factors: { reason: string; value: number | string }[];
    };
    verdict: {
        verdict: "Likely Legitimate" | "Suspicious" | "High Risk" | "Unknown";
        reason: string;
        overridden: boolean;
    };
    performance?: {
        id: string;
        name: string;
        durationMs: number;
        status: 'success' | 'timeout' | 'error';
    }[];
}
