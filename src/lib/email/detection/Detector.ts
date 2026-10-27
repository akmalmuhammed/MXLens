import type { AnalysisResult } from "../HeaderParser";
import type { NormalizedSignals, ParsedEmailAttachment, ParsedEmailBody } from "../scoring/types";

export type DetectionTag = 'auth' | 'content' | 'link' | 'malware' | 'identity';

export interface DetectionContext {
    header: AnalysisResult;
    signals: NormalizedSignals;
    emailBody?: ParsedEmailBody;
    attachments?: ParsedEmailAttachment[]; // Raw PostalMime attachments for deep scanning
    options: { checkBody: boolean; checkAttachments: boolean };
}

export interface DetectionResult {
    /** Id of the detector that produced this result (set by the pipeline). */
    id?: string;
    triggered: boolean;
    score: number; // 0 (Safe) to 1 (Malicious)
    penalty: number; // Score deduction (e.g. -10)
    name: string;
    reason: string;
    tags?: DetectionTag[];
    metadata?: unknown;
}

export interface Detector {
    id: string;
    name: string;
    description: string;
    tags: DetectionTag[];
    detect(context: DetectionContext): Promise<DetectionResult | null> | DetectionResult | null;
}
