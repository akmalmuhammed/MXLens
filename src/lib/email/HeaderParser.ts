import PostalMime from 'postal-mime';
import { AuthenticationAnalyzer, AuthStatus, OriginAuth } from './parser/Authentication';
import { ExchangeAnalyzer, ExchangeSignals } from './parser/Exchange';
import { HopTracer } from './parser/Hops';
import { ArtifactExtractor } from './parser/Artifacts';
import { getHeaderValue } from './parser/HeaderUtils';
import type { HeaderMap } from './parser/HeaderUtils';

export interface EmailHop {
    from: string;
    by: string;
    with?: string;
    time: string; // ISO string
    timestamp: number;
    delay: number; // Seconds since previous hop
    ip?: string;
    annotations?: string[]; // Phase 4: Hops Intelligence
}

export type { AuthStatus, OriginAuth, ExchangeSignals }; // Re-export for compatibility

interface ParsedAttachment {
    filename?: string | null;
    mimeType?: string | null;
    content?: string | Uint8Array | ArrayBuffer;
    size?: number;
}

export interface AnalysisResult {
    verdict: 'likely_legit' | 'suspicious' | 'high_risk' | 'neutral';
    score: number; // 0-100
    headers: HeaderMap;
    rawHeaders: string;
    auth: {
        spf: AuthStatus;
        dkim: AuthStatus;
        dmarc: AuthStatus;
    };
    hops: EmailHop[];
    artifacts: { type: string; value: string; label?: string }[];
    anomalies: string[];
    scoreFactors: { label: string; score: number }[];
    impersonationAlert?: string; // Phase 3: Impersonation
    recommendedActions?: string[]; // Phase 5: Action Mapping
    arc?: { // Phase 7: Advanced Forensics
        status: 'pass' | 'fail' | 'none';
        details: string[];
    };
    /** Earliest recorded auth evaluation (ARC i=1 / gateway header) compared with the final result. */
    originAuth?: OriginAuth;
    /** How Exchange Online / EOP handled the message (SCL, AuthAs, compauth). */
    exchange?: ExchangeSignals;
    xHeaders?: { key: string; value: string; explanation?: string }[];
    attachments?: { filename: string; mimeType: string; size: number; hash: string }[]; // Phase 9: Workflow
}

export class HeaderParser {
    // Helper to decode RFC 2047
    public static decodeHeaderValue(val: string): string {
        try {
            if (!val || typeof val !== 'string') return val;
            if (!val.includes("=?") || !val.includes("?=")) return val;

            return val.replace(/=\?([^\?]+)\?([BQbq])\?([^\?]+)\?=/g, (match, charset, encoding, text) => {
                try {
                    if (encoding.toUpperCase() === 'B') {
                        return new TextDecoder(charset).decode(
                            Uint8Array.from(atob(text), c => c.charCodeAt(0))
                        );
                    } else if (encoding.toUpperCase() === 'Q') {
                        let decoded = text.replace(/_/g, ' ');
                        decoded = decoded.replace(/=([0-9A-F]{2})/ig, (m: string, p1: string) => String.fromCharCode(parseInt(p1, 16)));

                        if (charset.toUpperCase() === 'UTF-8') {
                            const bytes = [];
                            for (let i = 0; i < text.length; i++) {
                                if (text[i] === '=') {
                                    const hex = text.substr(i + 1, 2);
                                    if (hex.length === 2) {
                                        bytes.push(parseInt(hex, 16));
                                        i += 2;
                                    } else {
                                        bytes.push(text.charCodeAt(i));
                                    }
                                } else if (text[i] === '_') {
                                    bytes.push(32);
                                } else {
                                    bytes.push(text.charCodeAt(i));
                                }
                            }
                            return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
                        }
                        return decoded;
                    }
                    return match;
                } catch {
                    return match;
                }
            });
        } catch {
            return val;
        }
    }

    static async parse(rawInput: string, options: { checkAttachments?: boolean } = {}): Promise<AnalysisResult> {
        const parser = new PostalMime();
        const email = await parser.parse(rawInput);
        const headerMap: HeaderMap = {};

        const process = (v: string) => {
            if (v && v.includes('=?') && v.includes('?=')) {
                return this.decodeHeaderValue(v);
            }
            return v;
        };

        const appendHeader = (key: string, value: string) => {
            const current = headerMap[key];
            if (Array.isArray(current)) {
                current.push(value);
            } else if (typeof current === 'string') {
                headerMap[key] = [current, value];
            } else {
                headerMap[key] = value;
            }
        };

        email.headers.forEach(h => {
            const cleanVal = process(h.value);
            appendHeader(h.key, cleanVal);
        });

        if (Object.keys(headerMap).length === 0) {
            const lines = rawInput.split(/\r?\n/);
            let currentKey = "";

            lines.forEach(line => {
                const match = line.match(/^([a-zA-Z0-9-]+):\s*(.*)$/);
                if (match) {
                    currentKey = match[1];
                    let val = match[2];
                    val = this.decodeHeaderValue(val);
                    appendHeader(currentKey, val);
                } else if (/^\s+/.test(line) && currentKey) {
                    const val = line.trim();
                    const current = headerMap[currentKey];
                    if (Array.isArray(current)) {
                        const arr = current;
                        arr[arr.length - 1] += " " + val;
                    } else if (typeof current === 'string') {
                        headerMap[currentKey] = `${current} ${val}`;
                    }
                }
            });
        }

        const getHeader = (key: string) => getHeaderValue(headerMap, key);

        // Delegate to sub-modules
        const auth = AuthenticationAnalyzer.analyze(getHeader('Authentication-Results'));
        const hops = HopTracer.analyze(getHeader('Received'));
        const artifacts = ArtifactExtractor.extract(headerMap, hops);
        const arc = AuthenticationAnalyzer.analyzeARC(headerMap);
        const originAuth = AuthenticationAnalyzer.analyzeOrigin(headerMap, auth, arc?.status);
        const exchange = ExchangeAnalyzer.analyze(headerMap);

        const { verdict, score, anomalies, scoreFactors } = this.calculateVerdict(headerMap, auth, hops);
        const impersonationAlert = this.detectImpersonation(headerMap, auth);
        const recommendedActions = this.getRecommendedActions(verdict, auth, impersonationAlert);
        const xHeaders = this.analyzeXHeaders(headerMap);
        const attachments = options.checkAttachments !== false
            ? await this.analyzeAttachments(email.attachments)
            : [];

        return {
            verdict,
            score,
            headers: headerMap,
            rawHeaders: rawInput.split(/\r?\n\r?\n/, 1)[0] || "",
            auth,
            hops,
            artifacts,
            anomalies,
            scoreFactors,
            impersonationAlert,
            recommendedActions,
            arc,
            originAuth,
            exchange,
            xHeaders,
            attachments
        };
    }

    private static async analyzeAttachments(attachments: ParsedAttachment[]): Promise<AnalysisResult['attachments']> {
        if (!attachments || attachments.length === 0) return [];
        const results: AnalysisResult['attachments'] = [];

        for (const att of attachments) {
            let hash = "";
            const content = this.toUint8Array(att.content);
            if (content) {
                hash = await this.calculateHash(content);
            }
            results.push({
                filename: att.filename || 'unknown',
                mimeType: att.mimeType || 'application/octet-stream',
                size: att.size || content?.byteLength || (typeof att.content === 'string' ? att.content.length : 0),
                hash
            });
        }
        return results;
    }

    private static async calculateHash(content: Uint8Array): Promise<string> {
        try {
            const hashBuffer = await crypto.subtle.digest('SHA-256', this.toArrayBuffer(content));
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            console.error("Hashing failed", e);
            return "";
        }
    }

    private static toUint8Array(content: ParsedAttachment['content']): Uint8Array | undefined {
        if (!content) return undefined;
        if (content instanceof Uint8Array) return content;
        if (content instanceof ArrayBuffer) return new Uint8Array(content);
        if (typeof content === 'string') return new TextEncoder().encode(content);
        return undefined;
    }

    private static toArrayBuffer(content: Uint8Array): ArrayBuffer {
        const copy = new Uint8Array(content.byteLength);
        copy.set(content);
        return copy.buffer;
    }

    private static analyzeXHeaders(headers: HeaderMap): AnalysisResult['xHeaders'] {
        const interesting = [
            { key: 'X-Spam-Status', label: 'Spam Status' },
            { key: 'X-Spam-Score', label: 'Spam Score' },
            { key: 'X-Mailer', label: 'Mailer Client' },
            { key: 'X-Distribution', label: 'Distribution List' },
            { key: 'X-Originating-IP', label: 'Originating IP' },
            { key: 'X-Gophish', label: 'GoPhish Header (Phishing Tool)' }
        ];

        const xHeaders: AnalysisResult['xHeaders'] = [];

        interesting.forEach(item => {
            const val = getHeaderValue(headers, item.key);
            if (val) {
                let explanation = "";
                const vStr = String(val).toLowerCase();

                if (item.key === 'X-Spam-Status') {
                    if (vStr.startsWith('yes')) explanation = "Upstream server marked this as SPAM.";
                    else if (vStr.startsWith('no')) explanation = "Upstream server marked this as NOT SPAM.";
                }

                if (item.key === 'X-Mailer') {
                    if (vStr.includes('php')) explanation = "Sent via PHP script. Common in automated alerts or spam scripts.";
                }

                if (item.key === 'X-Gophish') {
                    explanation = "**CRITICAL**: Sent via GoPhish framework. Likely a simulation or phishing test.";
                }

                xHeaders.push({
                    key: item.key,
                    value: String(val),
                    explanation: explanation || item.label
                });
            }
        });

        return xHeaders;
    }

    private static getRecommendedActions(verdict: string, auth: AnalysisResult['auth'], impersonationResult?: string): string[] {
        const actions: string[] = [];

        if (verdict === 'high_risk') {
            actions.push("Block sender domain/IP at gateway.");
            actions.push("Quarantine this email immediately.");
            if (impersonationResult) {
                actions.push("Initiate internal incident response protocol for impersonation.");
            }
        } else if (verdict === 'suspicious') {
            actions.push("Quarantine email for manual review.");
            actions.push("Do not click links or open attachments.");
        } else if (verdict === 'neutral') {
            actions.push("Exercise caution; verification data is insufficient.");
        }

        if (auth.dmarc.status === 'fail' && auth.dmarc.details.includes('reject')) {
            actions.push("Confirm rejection logs in DMARC report (if available).");
        }

        if (auth.spf.status === 'softfail' || auth.spf.status === 'fail') {
            actions.push("Verify if sender IP is authorized (check for forwarding).");
        }

        if (impersonationResult) {
            actions.push("Verify unexpected communication via out-of-band channel (Slack/Teams).");
        }

        return actions;
    }

    private static detectImpersonation(headers: HeaderMap, auth: AnalysisResult['auth']): string | undefined {
        const from = getHeaderValue(headers, 'From') || '';
        const highValueKeywords = ['admin', 'subport', 'security', 'hr', 'payroll', 'finance', 'ceo', 'it group', 'microsoft', 'google'];

        const fromHeader = Array.isArray(from) ? from[0] : from;
        const match = fromHeader.match(/^"?([^"<]+)"?\s*<.*>$/);
        if (!match) return undefined;

        const displayName = match[1].toLowerCase();
        const triggeredKeyword = highValueKeywords.find(kw => displayName.includes(kw));

        if (triggeredKeyword) {
            if (auth.dmarc.status !== 'pass' && auth.spf.status !== 'pass' && auth.dkim.status !== 'pass') {
                return `Sender is mimicking "${triggeredKeyword.toUpperCase()}" but failed all authentication checks.`;
            }

            if (auth.dmarc.status === 'none' || auth.dmarc.status === 'fail') {
                return `Sender name "${match[1]}" suggests high privilege, but DMARC is not enforced. Verify origin carefully.`;
            }
        }

        return undefined;
    }

    private static calculateVerdict(headers: HeaderMap, auth: AnalysisResult['auth'], hops: EmailHop[]) {
        let score = 50;
        const anomalies: string[] = [];
        const factors: { label: string; score: number }[] = [];

        const addFactor = (label: string, points: number) => {
            score += points;
            factors.push({ label, score: points });
        };

        addFactor("Base Score", 50);

        if (auth.dmarc.status === 'pass') addFactor("DMARC Passed", 20);
        else if (auth.dmarc.status === 'fail') {
            addFactor("DMARC Failed", -30);
            anomalies.push('DMARC Validation Failed');
        }

        if (auth.spf.status === 'pass') addFactor("SPF Passed", 10);
        else if (auth.spf.status === 'fail' || auth.spf.status === 'softfail') {
            addFactor("SPF Failed/Softfail", -10);
            anomalies.push('SPF Validation Failed');
        }

        if (auth.dkim.status === 'pass') addFactor("DKIM Passed", 10);
        else if (auth.dkim.status === 'fail') {
            addFactor("DKIM Failed", -10);
            anomalies.push('DKIM Validation Failed');
        }

        const from = getHeaderValue(headers, 'From');
        const returnPath = getHeaderValue(headers, 'Return-Path');

        const fromText = Array.isArray(from) ? from[0] : from;
        const returnPathText = Array.isArray(returnPath) ? returnPath[0] : returnPath;

        if (typeof fromText === 'string' && typeof returnPathText === 'string') {
            const fromDomain = fromText.match(/@([\w.-]+)/)?.[1];
            const rpDomain = returnPathText.match(/@([\w.-]+)/)?.[1];

            if (fromDomain && rpDomain) {
                if (!rpDomain.includes(fromDomain) && !fromDomain.includes(rpDomain)) {
                    if (auth.dmarc.status !== 'pass') {
                        addFactor("From/Return-Path Mismatch", -5);
                        anomalies.push('From/Return-Path Domain Mismatch');
                    }
                } else {
                    addFactor("Domains Aligned", 5);
                }
            }
        }

        if (hops.length === 0) {
            addFactor("No Receive Headers", -20);
            anomalies.push('No Receive headers found (missing hops)');
        } else {
            addFactor("Delivery Path Traceable", 5);
        }

        score = Math.max(0, Math.min(100, score));

        let verdict: AnalysisResult['verdict'] = 'neutral';
        if (score >= 70) verdict = 'likely_legit';
        else if (score <= 30) verdict = 'high_risk';
        else verdict = 'suspicious';

        return { verdict, score, anomalies, scoreFactors: factors };
    }
}
