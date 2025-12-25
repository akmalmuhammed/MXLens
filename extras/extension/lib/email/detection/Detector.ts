import { AnalysisResult } from "../HeaderParser";
import { NormalizedSignals } from "../scoring/types";

export interface DetectionContext {
    header: AnalysisResult;
    signals: NormalizedSignals;
    emailBody?: { text: string; html: string };
    attachments?: any[]; // Raw PostalMime attachments for deep scanning
    options: { checkBody: boolean; checkAttachments: boolean };
}

export interface DetectionResult {
    triggered: boolean;
    score: number; // 0 (Safe) to 1 (Malicious)
    penalty: number; // Score deduction (e.g. -10)
    name: string;
    reason: string;
    metadata?: any;
}

export interface Detector {
    id: string;
    name: string;
    description: string;
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[];
    detect(context: DetectionContext): Promise<DetectionResult | null> | DetectionResult | null;
}
