import { AnalysisResult } from "../HeaderParser";
import { getHeaderValues } from "./HeaderUtils";
import type { HeaderMap } from "./HeaderUtils";

export interface AuthStatus {
    status: 'pass' | 'fail' | 'neutral' | 'none' | 'softfail' | 'policy' | 'temperror' | 'permerror';
    details: string;
    explanation?: string;
    aligned?: boolean;
    /**
     * Set when the receiver reported an inferred result such as Microsoft's
     * `dmarc=bestguesspass`: no DMARC record exists, so this is not a real DMARC pass.
     */
    bestGuess?: boolean;
}

/**
 * Authentication evidence recorded by the earliest evaluator in the delivery chain
 * (ARC i=1 or a vendor gateway header), which can differ from the final
 * Authentication-Results when a gateway sits in front of the mailbox provider.
 */
export interface OriginAuth {
    /** Where the evidence came from, e.g. "ARC-Authentication-Results i=1". */
    source: string;
    /** authserv-id of the evaluator, when present. */
    authserv?: string;
    spf?: AuthStatus['status'];
    dkim?: AuthStatus['status'];
    dmarc?: AuthStatus['status'];
    /** DMARC disposition text such as "none", "quarantine" or "no records". */
    dmarcAction?: string;
    /** IP the earliest evaluator checked SPF against. */
    spfIp?: string;
    /** IP the final Authentication-Results checked SPF against. */
    finalSpfIp?: string;
    /** True when the ARC chain is not cryptographically valid, so this is unverified. */
    unverified: boolean;
    /**
     * True when the earliest evaluation failed SPF/DMARC but the final result passed
     * SPF for a different IP (a relay/gateway), so the final pass hides the real origin.
     */
    masked: boolean;
}

export interface AuthMethods {
    spf?: AuthStatus['status'];
    dkim?: AuthStatus['status'];
    dmarc?: AuthStatus['status'];
    dmarcAction?: string;
    dmarcBestGuess?: boolean;
    ip?: string;
    authserv?: string;
    mailFrom?: string;
    headerFrom?: string;
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

    /**
     * Parses one Authentication-Results style value (or a vendor equivalent such as
     * X-TM-Authentication-Results) into its spf/dkim/dmarc verdicts.
     */
    static parseMethods(header: string): AuthMethods {
        const out: AuthMethods = {};
        const spf = header.match(/\bspf=([a-z]+)/i);
        if (spf) out.spf = this.normalizeStatus(spf[1]);
        const dkim = header.match(/\bdkim=([a-z]+)/i);
        if (dkim) out.dkim = this.normalizeStatus(dkim[1]);
        const dmarc = header.match(/\bdmarc=([a-z]+)/i);
        if (dmarc) {
            out.dmarc = this.normalizeStatus(dmarc[1]);
            out.dmarcBestGuess = /^bestguess/i.test(dmarc[1]);
        }
        const action = header.match(/\baction=((?:no records)|[^\s;]+)/i);
        if (action) out.dmarcAction = action[1].toLowerCase();
        const ip = header.match(/(?:sender\s+ip(?:\s+address)?(?:\s+is)?|client-ip)\s*[:=]?\s*\[?([0-9a-f:.]{3,45})/i);
        if (ip) out.ip = ip[1].replace(/[.:]+$/, "");
        const mailFrom = header.match(/smtp\.mailfrom=(?:[^@\s;]+@)?([a-z0-9.-]+)/i);
        if (mailFrom) out.mailFrom = mailFrom[1].toLowerCase();
        const headerFrom = header.match(/header\.from=([a-z0-9.-]+)/i);
        if (headerFrom) out.headerFrom = headerFrom[1].toLowerCase();
        out.authserv = this.parseAuthServId(header);
        return out;
    }

    /** authserv-id without the optional version token ("mx.microsoft.com 1" -> "mx.microsoft.com"). */
    static parseAuthServId(header: string): string | undefined {
        // ARC-Authentication-Results starts with "i=N;" before the authserv-id.
        const cleaned = header.replace(/^\s*i=\d+\s*;\s*/i, "");
        const first = cleaned.split(";")[0]?.trim();
        if (!first || first.includes("=")) return undefined;
        const id = first.split(/\s+/)[0];
        return id || undefined;
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
        const methods = this.parseMethods(mainHeader);

        // SPF
        if (methods.spf) {
            result.spf.status = methods.spf;
            result.spf.details = mainHeader.match(/spf=[^;]+/i)?.[0] || 'Found in headers';
        }
        result.spf.explanation = this.getAuthExplanation('spf', result.spf.status, result.spf.details);

        // DKIM
        if (methods.dkim) {
            result.dkim.status = methods.dkim;
            result.dkim.details = mainHeader.match(/dkim=[^;]+/i)?.[0] || 'Found in headers';
        }
        result.dkim.explanation = this.getAuthExplanation('dkim', result.dkim.status, result.dkim.details);

        // DMARC
        if (methods.dmarc || /\bdmarc=/i.test(mainHeader)) {
            result.dmarc.status = methods.dmarc ?? 'none';
            result.dmarc.details = mainHeader.match(/dmarc=[^;]+/i)?.[0] || 'Found in headers';
            if (methods.dmarcBestGuess) result.dmarc.bestGuess = true;
        }
        result.dmarc.explanation = result.dmarc.bestGuess
            ? "The receiver reported dmarc=bestguesspass. No DMARC record is published for this domain, so this is an inferred result from SPF/DKIM alignment, not a verified DMARC pass."
            : this.getAuthExplanation('dmarc', result.dmarc.status, result.dmarc.details);

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
        const originAar = this.findOriginAar(arcResults);

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
        } else if (originAar) {
            // The chain is broken or unsealed, so these values are not cryptographically
            // verified, but they still record what the first evaluator saw. Report them
            // under a different label so they never feed the ARC override.
            const o = this.parseMethods(originAar);
            const parts: string[] = [];
            if (o.spf) parts.push(`SPF ${o.spf}${o.ip ? ` (${o.ip})` : ""}`);
            if (o.dkim) parts.push(`DKIM ${o.dkim}`);
            if (o.dmarc) parts.push(`DMARC ${o.dmarc}${o.dmarcAction ? ` (action: ${o.dmarcAction})` : ""}`);
            if (parts.length > 0) {
                details.push(`Unverified first-hop results (i=1): ${parts.join(", ")}`);
            }
        }

        return { status, details };
    }

    private static findOriginAar(arcResults: string[]): string {
        let origin = "";
        for (const h of arcResults) {
            if (typeof h === 'string' && /(?:^|[\s;])i=1\s*;/i.test(h)) origin = h;
        }
        return origin;
    }

    /**
     * Finds the earliest recorded authentication evaluation (ARC i=1, otherwise a
     * vendor gateway header such as X-TM-Authentication-Results) and compares it with
     * the final Authentication-Results. When a gateway sits in front of the mailbox
     * provider, the final result is computed against the gateway's IP, so a message
     * that failed SPF/DMARC at the edge can still show "spf=pass" at the end.
     */
    static analyzeOrigin(
        headers: HeaderMap,
        finalAuth: AnalysisResult['auth'],
        arcStatus: NonNullable<AnalysisResult['arc']>['status'] | undefined
    ): OriginAuth | undefined {
        const finalHeader = getHeaderValues(headers, 'Authentication-Results')[0];
        const finalMethods = finalHeader ? this.parseMethods(finalHeader) : undefined;

        let raw = this.findOriginAar(getHeaderValues(headers, 'ARC-Authentication-Results'));
        let source = "ARC-Authentication-Results (i=1)";

        if (!raw) {
            const vendorKey = Object.keys(headers).find(k => /^x-[a-z0-9-]*authentication-results$/i.test(k));
            if (vendorKey) {
                raw = getHeaderValues(headers, vendorKey)[0] || "";
                source = vendorKey;
            }
        }
        if (!raw) return undefined;

        const origin = this.parseMethods(raw);
        if (!origin.spf && !origin.dkim && !origin.dmarc) return undefined;

        const originSpfBad = origin.spf === 'fail' || origin.spf === 'softfail';
        const originDmarcBad = origin.dmarc === 'fail';
        // A forwarder breaks SPF but preserves DKIM, so DMARC pass at the origin
        // means the earlier SPF failure is explained and not suspicious by itself.
        const originWorse = origin.dmarc !== 'pass' && (originSpfBad || originDmarcBad);
        const finalImproved =
            (originSpfBad && finalAuth.spf.status === 'pass') ||
            (originDmarcBad && finalAuth.dmarc.status !== 'fail');

        const finalIp = finalMethods?.ip;
        const ipsDiffer = !origin.ip || !finalIp || origin.ip !== finalIp;

        return {
            source,
            authserv: origin.authserv,
            spf: origin.spf,
            dkim: origin.dkim,
            dmarc: origin.dmarc,
            dmarcAction: origin.dmarcAction,
            spfIp: origin.ip,
            finalSpfIp: finalIp,
            unverified: arcStatus !== 'pass',
            masked: originWorse && finalImproved && ipsDiffer
        };
    }
}
