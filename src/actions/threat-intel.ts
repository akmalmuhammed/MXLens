
"use server";

import { checkIPReputation, checkDomainReputation, ThreatIntelResult } from "@/lib/threat-intel/virustotal";
import { checkSafeBrowsing } from "@/lib/threat-intel/safebrowsing";
import { checkAbuseIPDB } from "@/lib/threat-intel/abuseipdb";
import { getDomainAge } from "@/lib/threat-intel/whois";

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

    // 4. Domain Age (Parallel Domains)
    const agePromises = domainTargets.map(d => getDomainAge(d));

    const [vtResults, gsbResults, abuseResults, ageResults] = await Promise.all([
        Promise.all(vtPromises),
        gsbPromise,
        Promise.all(abusePromises),
        Promise.all(agePromises)
    ]);

    // Aggregate VT Results
    vtResults.forEach(r => {
        if (r) results.push({ ...r, provider: 'VirusTotal' });
    });

    // Aggregate AbuseIPDB Results
    abuseResults.forEach(r => {
        if (r) {
            const existing = results.find(res => res.target === r.ipAddress && res.type === 'ip');
            const score = r.abuseConfidenceScore;
            let verdict: ThreatIntelResult['verdict'] = 'clean';
            if (score > 50) verdict = 'malicious';
            else if (score > 0) verdict = 'suspicious';

            if (existing) {
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
                    stats: { malicious: r.totalReports, suspicious: r.abuseConfidenceScore, harmless: 0, undetected: 0, timeout: 0 },
                    lastAnalysisDate: r.lastReportedAt || new Date().toISOString(),
                    verdict,
                    provider: 'AbuseIPDB'
                });
            }
        }
    });

    // Aggregate Safe Browsing Results
    gsbResults.forEach(r => {
        if (!r.safe) {
            results.push({
                target: r.target,
                type: 'domain',
                reputation: 100,
                stats: { malicious: 1, suspicious: 0, harmless: 0, undetected: 0, timeout: 0 },
                lastAnalysisDate: new Date().toISOString(),
                verdict: 'malicious',
                provider: 'GoogleSafeBrowsing'
            });
        }
    });

    // Aggregate Domain Age Results
    ageResults.forEach(r => {
        if (r) {
            const existing = results.find(res => res.target === r.domain && res.type === 'domain');

            // "Fresh" domains < 30 days are suspicious
            if (r.isFresh) {
                if (existing) {
                    // Bump existing score
                    existing.reputation = Math.max(existing.reputation, 75);
                    if (existing.verdict === 'clean') existing.verdict = 'suspicious';
                    existing.domainAge = { days: r.ageDays, createdDate: r.createdDate, registrar: r.registrar };
                } else {
                    results.push({
                        target: r.domain,
                        type: 'domain',
                        reputation: 75,
                        stats: { malicious: 0, suspicious: 1, harmless: 0, undetected: 0, timeout: 0 },
                        lastAnalysisDate: new Date().toISOString(),
                        verdict: 'suspicious',
                        provider: 'Whois/RDAP',
                        domainAge: { days: r.ageDays, createdDate: r.createdDate, registrar: r.registrar }
                    });
                }
            } else if (existing) {
                // Attach age data even if safe
                existing.domainAge = { days: r.ageDays, createdDate: r.createdDate, registrar: r.registrar };
            }
        }
    });

    // 5. URLhaus Check (Quick implementation inline)
    // URLhaus API: https://urlhaus-api.abuse.ch/v1/host/
    // Checks if domain or IP is known C2
    const uhPromises = [...domainTargets, ...ipTargets].map(async (host) => {
        try {
            const formData = new FormData();
            formData.append('host', host);
            const res = await fetch('https://urlhaus-api.abuse.ch/v1/host/', {
                method: 'POST',
                body: formData
            });
            if (!res.ok) return null;
            const json = await res.json();
            if (json.query_status === 'ok' && json.urls && json.urls.length > 0) {
                return { host, count: json.urls.length };
            }
            return null;
        } catch { return null; }
    });

    const uhResults = await Promise.all(uhPromises);

    uhResults.forEach(r => {
        if (r) {
            const existing = results.find(res => res.target === r.host);
            if (existing) {
                existing.reputation = 100;
                existing.verdict = 'malicious';
                // Add annotation or merge provider (simplified here)
            } else {
                results.push({
                    target: r.host,
                    type: r.host.includes('.') && !r.host.match(/^\d/) ? 'domain' : 'ip', // simple detection
                    reputation: 100,
                    stats: { malicious: r.count, suspicious: 0, harmless: 0, undetected: 0, timeout: 0 },
                    lastAnalysisDate: new Date().toISOString(),
                    verdict: 'malicious',
                    provider: 'VirusTotal' // Reusing generic provider slot or add new if strict typed
                });
            }
        }
    });

    return results;
}
