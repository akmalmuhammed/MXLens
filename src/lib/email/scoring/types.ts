import type { DetectionTag } from "../detection/Detector";

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

    /** Receiver reported dmarc=bestguesspass: no DMARC record, result inferred. */
    dmarcBestGuess: boolean;
    /** Earliest evaluator failed SPF/DMARC but the final result passed for a relay IP. */
    originAuthMasked: boolean;
    /** Human-readable summary of the masked origin evaluation, when masked. */
    originAuthSummary: string | null;
    /** Exchange skipped spam filtering (SCL -1) for an anonymous external connection. */
    exchangeFilteringBypassed: boolean;

    receivedHopCount: number;
    hasReceivedHeaders: boolean;
    headerInjectionDetected: boolean;
    receivedTimestampsValid: boolean;

    fromDomain: string;
    fromDisplayName: string;
    replyToDomain: string | null;
    returnPathDomain: string;
    senderAsn?: string | null;

    // Threading Signals
    subject: string;
    inReplyTo: string | null;
    references: string | null;

    bodyAnalysisEnabled: boolean;
    /** Text a recipient would read (HTML stripped, entities decoded) plus plain text part. */
    visibleText?: string;
    hasUrgency: boolean;
    hasCredentialHarvesting: boolean;
    hasHiddenText: boolean;
    hasHtmlForm: boolean;
    suspiciousLinks: boolean;
    rawIpLinks: boolean;
    extractedUrls: string[];
    urlAnalysis: {  // From UrlAnalyzer
        href: string;
        display: string;
        isMismatched: boolean;
        isSubdomainTrick: boolean;
        isLookalike: boolean;
        riskScore: number;
        details: string[];
    }[];
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
    tags?: DetectionTag[];
}

export interface ParsedEmailAttachment {
    filename?: string | null;
    mimeType?: string;
    size?: number;
    content?: string | ArrayBuffer | Uint8Array;
}

export interface ParsedEmailBody {
    text?: string;
    html?: string;
    attachments?: ParsedEmailAttachment[];
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
