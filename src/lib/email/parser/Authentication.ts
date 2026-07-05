import { AnalysisResult } from "../HeaderParser";
import { getHeaderValues } from "./HeaderUtils";
import type { HeaderMap } from "./HeaderUtils";

export interface AuthStatus {
    status: 'pass' | 'fail' | 'neutral' | 'none' | 'softfail' | 'policy' | 'temperror' | 'permerror';
    details: string;
    explanation?: string;
    aligned?: boolean;
}

export class AuthenticationAnalyzer {
    static getAuthExplanation(type: 'spf' | 'dkim' | 'dmarc', status: string, details: string): string {
        const s = status.toLowerCase();

        if (type === 'spf') {
            if (s === 'pass') return "Authentication-Results reports the sender IP was authorized by SPF.";
            if (s === 'fail') return "Authentication-Results reports the sender IP was not authorized. Strong spoofing signal unless forwarding is involved.";
            if (s === 'softfail') return "Authentication-Results reports SPF softfail. The domain discourages this sender, but has not published a hard fail policy.";
            if (s === 'none') return "Authentication-Results reports no SPF result for this message.";
            if (s === 'neutral') return "Authentication-Results reports SPF neutral; the domain did not explicitly authorize or deny this IP.";
            if (s === 'temperror') return "Authentication-Results reports a temporary SPF/DNS error.";
            if (s === 'permerror') return "Authentication-Results reports an invalid SPF record or permanent SPF error.";
        }

        if (type === 'dkim') {
            if (s === 'pass') return "Authentication-Results reports a valid DKIM signature.";
            if (s === 'fail') return "Authentication-Results reports DKIM verification failed. Body or signed headers may have changed.";
            if (s === 'none') return "Authentication-Results reports no DKIM signature was verified.";
            if (s === 'neutral') return "Authentication-Results reports a DKIM signature that was not valid for this sender.";
        }

        if (type === 'dmarc') {
            if (s === 'pass') return "Authentication-Results reports DMARC alignment passed via SPF or DKIM.";
            if (s === 'fail') {
                if (details.includes('reject')) return "Authentication-Results reports DMARC failed against a reject policy.";
                if (details.includes('quarantine')) return "Authentication-Results reports DMARC failed against a quarantine policy.";
                return "Authentication-Results reports DMARC failed. This is a strong spoofing indicator.";
            }
            if (s === 'none') return "Authentication-Results reports no DMARC result for this message.";
        }

        return "";
    }

    static analyze(authHeader?: string | string[]): AnalysisResult['auth'] {
        const result: AnalysisResult['auth'] = {
            spf: { status: 'none', details: 'No SPF check found' },
            dkim: { status: 'none', details: 'No DKIM check found' },
            dmarc: { status: 'none', details: 'No DMARC check found' }
        };

        if (!authHeader) {
            result.spf.explanation = this.getAuthExplanation('spf', 'none', '');
            result.dkim.explanation = this.getAuthExplanation('dkim', 'none', '');
            result.dmarc.explanation = this.getAuthExplanation('dmarc', 'none', '');
            return result;
        }

        const mainHeader = Array.isArray(authHeader) ? authHeader[0] : authHeader;

        // SPF
        const spfMatch = mainHeader.match(/spf=(\w+)/i);
        if (spfMatch) {
            result.spf.status = this.normalizeStatus(spfMatch[1]);
            result.spf.details = mainHeader.match(/spf=[^;]+/)?.[0] || 'Found in headers';
        }
        result.spf.explanation = this.getAuthExplanation('spf', result.spf.status, result.spf.details);

        // DKIM
        const dkimMatch = mainHeader.match(/dkim=(\w+)/i);
        if (dkimMatch) {
            result.dkim.status = this.normalizeStatus(dkimMatch[1]);
            result.dkim.details = mainHeader.match(/dkim=[^;]+/)?.[0] || 'Found in headers';
        }
        result.dkim.explanation = this.getAuthExplanation('dkim', result.dkim.status, result.dkim.details);

        // DMARC
        const dmarcMatch = mainHeader.match(/dmarc=(\w+)/i);
        if (dmarcMatch) {
            result.dmarc.status = this.normalizeStatus(dmarcMatch[1]);
            result.dmarc.details = mainHeader.match(/dmarc=[^;]+/)?.[0] || 'Found in headers';
        }
        result.dmarc.explanation = this.getAuthExplanation('dmarc', result.dmarc.status, result.dmarc.details);

        return result;
    }

    private static normalizeStatus(status: string): AuthStatus['status'] {
        const normalized = status.toLowerCase();
        const valid: AuthStatus['status'][] = ['pass', 'fail', 'neutral', 'none', 'softfail', 'policy', 'temperror', 'permerror'];
        return valid.includes(normalized as AuthStatus['status']) ? normalized as AuthStatus['status'] : 'none';
    }

    static analyzeARC(headers: HeaderMap): AnalysisResult['arc'] {
        const arcResults = getHeaderValues(headers, 'ARC-Authentication-Results');
        const arcSeals = getHeaderValues(headers, 'ARC-Seal');

        if (arcResults.length === 0 && arcSeals.length === 0) return { status: 'none', details: [] };

        const details: string[] = [];
        let status: NonNullable<AnalysisResult['arc']>['status'] = 'none';

        // 1. Check Chain Validation (ARC-Seal)
        // We look at the most recent seal (top of the list)
        const latestSeal = arcSeals[0] || "";

        const latestSealLower = latestSeal.toLowerCase();

        if (latestSealLower.includes('cv=pass')) {
            status = 'pass';
            details.push("Chain Validation: Pass (Trusted Forwarder)");
        } else if (latestSealLower.includes('cv=fail')) {
            status = 'fail';
            details.push("Chain Validation: Fail (Tampered Chain)");
        } else {
            status = 'none';
        }

        // 2. Analyze Authentication Results (AAR)
        // We want to find the result from the "Origin" (usually i=1)
        const aarHeaders = arcResults;

        // Find i=1 (Origin) and High index (Latest)
        let originAar = "";

        aarHeaders.forEach(h => {
            if (typeof h === 'string' && h.toLowerCase().includes('i=1;')) {
                originAar = h;
            }
        });

        if (status === 'pass' && originAar) {
            // Extract Original SPF/DKIM from the first hop
            const spfMatch = originAar.match(/spf=([a-z]+)/i);
            const dkimMatch = originAar.match(/dkim=([a-z]+)/i);
            const domainMatch = originAar.match(/smtp\.mailfrom=([\w.-]+)/i) || originAar.match(/header\.from=([\w.-]+)/i);

            if (spfMatch) details.push(`Origin SPF: ${spfMatch[1]}`);
            if (dkimMatch) details.push(`Origin DKIM: ${dkimMatch[1]}`);
            if (domainMatch) details.push(`Origin Domain: ${domainMatch[1]}`);
        } else if (status === 'pass') {
            details.push("ARC Valid, but Origin (i=1) header missing.");
        }

        return { status, details };
    }
}
