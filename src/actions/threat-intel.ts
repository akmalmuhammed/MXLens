
"use server";

import { checkIPReputation, checkDomainReputation, ThreatIntelResult } from "@/lib/threat-intel/virustotal";
import { checkSafeBrowsing } from "@/lib/threat-intel/safebrowsing";
import { checkAbuseIPDB } from "@/lib/threat-intel/abuseipdb";

/**
 * Server Action to check multiple targets against Threat Intel
 */
export async function checkThreatIntel(targets: { type: 'ip' | 'domain', value: string }[]): Promise<ThreatIntelResult[]> {
    const results: ThreatIntelResult[] = [];

    // Batches for separate services
    // Limit to prevent API exhaustion
    const uniqueTargets = Array.from(new Set(targets.map(t => JSON.stringify(t)))).map(s => JSON.parse(s));
    const ipTargets: string[] = uniqueTargets.filter((t: any) => t.type === 'ip').map((t: any) => t.value).slice(0, 5);
    const domainTargets: string[] = uniqueTargets.filter((t: any) => t.type === 'domain').map((t: any) => t.value).slice(0, 5);

    // 1. VirusTotal Checks (Parallel)
    const vtPromises = [
        ...ipTargets.map(ip => checkIPReputation(ip)),
        ...domainTargets.map(d => checkDomainReputation(d))
    ];

    // 2. Google Safe Browsing (Batch)
    const gsbPromise = domainTargets.length > 0 ? checkSafeBrowsing(domainTargets) : Promise.resolve([]);

    // 3. AbuseIPDB (Parallel IPs)
    const abusePromises = ipTargets.map(ip => checkAbuseIPDB(ip));

    const [vtResults, gsbResults, abuseResults] = await Promise.all([
        Promise.all(vtPromises),
        gsbPromise,
        Promise.all(abusePromises)
    ]);

    // Aggregate VT Results
    vtResults.forEach(r => {
        if (r) results.push({ ...r, provider: 'VirusTotal' });
    });

    // Aggregate AbuseIPDB Results - Convert to generic ThreatIntelResult format
    abuseResults.forEach(r => {
        if (r) {
            // Find existing VT record to merge or create new
            const existing = results.find(res => res.target === r.ipAddress && res.type === 'ip');

            // Abuse score > 0 is suspicious, > 50 is malicious
            const score = r.abuseConfidenceScore;
            let verdict: ThreatIntelResult['verdict'] = 'clean';
            if (score > 50) verdict = 'malicious';
            else if (score > 0) verdict = 'suspicious';

            if (existing) {
                // Enrich existing record if AbuseIPDB has higher confidence
                // We keep the "VirusTotal" label as primary if it exists, but update score/verdict
                if (score > existing.reputation) {
                    existing.reputation = score;
                    if (verdict === 'malicious') existing.verdict = 'malicious';
                    else if (verdict === 'suspicious' && existing.verdict === 'clean') existing.verdict = 'suspicious';
                }
            } else {
                results.push({
                    target: r.ipAddress,
                    type: 'ip',
                    reputation: score,
                    stats: {
                        malicious: r.totalReports,
                        suspicious: r.abuseConfidenceScore,
                        harmless: 0,
                        undetected: 0,
                        timeout: 0
                    },
                    lastAnalysisDate: r.lastReportedAt || new Date().toISOString(),
                    verdict,
                    provider: 'AbuseIPDB' as any
                });
            }
        }
    });

    // Aggregate Safe Browsing Results
    gsbResults.forEach(r => {
        if (!r.safe) {
            // Safe Browsing is binary usually
            results.push({
                target: r.target,
                type: 'domain',
                reputation: 100,
                stats: { malicious: 1, suspicious: 0, harmless: 0, undetected: 0, timeout: 0 },
                lastAnalysisDate: new Date().toISOString(),
                verdict: 'malicious',
                provider: 'GoogleSafeBrowsing' as any
            });
        }
    });

    return results;
}
