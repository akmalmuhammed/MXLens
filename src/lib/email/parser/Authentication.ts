import { AnalysisResult } from "../HeaderParser";

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
            if (s === 'pass') return "Sender IP is authorized by the domain's SPF record.";
            if (s === 'fail') return "Sender IP is NOT authorized. High confidence spoofing signal (unless forwarding).";
            if (s === 'softfail') return "Sender IP is not authorized, but domain is in 'testing' mode (~all). Suspicious.";
            if (s === 'none') return "No SPF record found for this domain. weak security posture.";
            if (s === 'neutral') return "Domain does not explicitly authorize or deny this IP (?all).";
            if (s === 'temperror') return "Temporary DNS error during check. Try again later.";
            if (s === 'permerror') return "Invalid SPF record syntax. Administrator error.";
        }

        if (type === 'dkim') {
            if (s === 'pass') return "Email cryptographic signature is valid and unaltered.";
            if (s === 'fail') return "Cryptographic signature failed verification. Body or headers may have been modified.";
            if (s === 'none') return "Email was not signed. Common for spam or very old systems.";
            if (s === 'neutral') return "Signature exists but is not valid for this sender.";
        }

        if (type === 'dmarc') {
            if (s === 'pass') return "Email aligns with domain policy (SPF or DKIM passed & aligned). Legitimate.";
            if (s === 'fail') {
                if (details.includes('reject')) return "DMARC Failed & Rejected. This email would typically be blocked by gateways.";
                if (details.includes('quarantine')) return "DMARC Failed & Quarantined. This email is likely in Spam/Junk folder.";
                return "DMARC Failed. Domain failed policy checks. Strong spoofing indicator.";
            }
            if (s === 'none') return "No DMARC policy published. Domain is vulnerable to spoofing.";
        }

        return "";
    }

    static analyze(authHeader: string | string[]): AnalysisResult['auth'] {
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
            result.spf.status = spfMatch[1].toLowerCase() as any;
            result.spf.details = mainHeader.match(/spf=[^;]+/)?.[0] || 'Found in headers';
        }
        result.spf.explanation = this.getAuthExplanation('spf', result.spf.status, result.spf.details);

        // DKIM
        const dkimMatch = mainHeader.match(/dkim=(\w+)/i);
        if (dkimMatch) {
            result.dkim.status = dkimMatch[1].toLowerCase() as any;
            result.dkim.details = mainHeader.match(/dkim=[^;]+/)?.[0] || 'Found in headers';
        }
        result.dkim.explanation = this.getAuthExplanation('dkim', result.dkim.status, result.dkim.details);

        // DMARC
        const dmarcMatch = mainHeader.match(/dmarc=(\w+)/i);
        if (dmarcMatch) {
            result.dmarc.status = dmarcMatch[1].toLowerCase() as any;
            result.dmarc.details = mainHeader.match(/dmarc=[^;]+/)?.[0] || 'Found in headers';
        }
        result.dmarc.explanation = this.getAuthExplanation('dmarc', result.dmarc.status, result.dmarc.details);

        return result;
    }

    static analyzeARC(headers: any): AnalysisResult['arc'] {
        const arcResults = headers['ARC-Authentication-Results'];
        const arcSeal = headers['ARC-Seal'];

        if (!arcResults && !arcSeal) return { status: 'none', details: [] };

        const details: string[] = [];
        let status: NonNullable<AnalysisResult['arc']>['status'] = 'none';

        let arcAuthDetails = "";
        if (arcResults) {
            const val = Array.isArray(arcResults) ? arcResults[0] : arcResults;
            arcAuthDetails = val;
            details.push(`Results: ${val.substring(0, 100)}...`);
            if (val.includes('arc=pass')) status = 'pass';
            else if (val.includes('arc=fail')) status = 'fail';
        }

        if (arcSeal) {
            const val = Array.isArray(arcSeal) ? arcSeal[0] : arcSeal;
            if (val.includes('cv=pass')) {
                if (status !== 'fail') status = 'pass';
                details.push("Chain Validation: Pass");
            } else if (val.includes('cv=fail')) {
                status = 'fail';
                details.push("Chain Validation: Fail");
            }
        }

        if (status === 'pass' && arcAuthDetails) {
            const spfMatch = arcAuthDetails.match(/spf=([a-z]+)/i);
            const dkimMatch = arcAuthDetails.match(/dkim=([a-z]+)/i);

            if (spfMatch) details.push(`Original SPF: ${spfMatch[1]}`);
            if (dkimMatch) details.push(`Original DKIM: ${dkimMatch[1]}`);
        }

        return { status, details };
    }
}
