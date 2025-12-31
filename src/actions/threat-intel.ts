
"use server";

import { checkIPReputation, checkDomainReputation, checkFileReputation, ThreatIntelResult } from "@/lib/threat-intel/virustotal";
import { checkSafeBrowsing } from "@/lib/threat-intel/safebrowsing";
import { checkAbuseIPDB } from "@/lib/threat-intel/abuseipdb";
import { checkMalwareBazaar, checkThreatFox } from "@/lib/threat-intel/abuse-ch";
import { getDomainAge } from "@/lib/threat-intel/whois";

/**
 * Server Action to check multiple targets against Threat Intel
 */
export async function checkThreatIntel(targets: { type: 'ip' | 'domain' | 'hash', value: string }[]): Promise<ThreatIntelResult[]> {
    const results: ThreatIntelResult[] = [];

    // Batches for separate services
    // Limit to prevent API exhaustion
    const uniqueTargets = Array.from(new Set(targets.map(t => JSON.stringify(t)))).map(s => JSON.parse(s));
    const ipTargets: string[] = uniqueTargets.filter((t: any) => t.type === 'ip').map((t: any) => t.value).slice(0, 5);
    const domainTargets: string[] = uniqueTargets.filter((t: any) => t.type === 'domain').map((t: any) => t.value).slice(0, 5);
    const hashTargets: string[] = uniqueTargets.filter((t: any) => t.type === 'hash').map((t: any) => t.value).slice(0, 5);

    // 1. VirusTotal Checks (Parallel)
    const vtPromises = [
        ...ipTargets.map(ip => checkIPReputation(ip)),
        ...domainTargets.map(d => checkDomainReputation(d)),
        ...hashTargets.map(h => checkFileReputation(h))
    ];

    // 2. Google Safe Browsing (Batch)
    const gsbPromise = domainTargets.length > 0 ? checkSafeBrowsing(domainTargets) : Promise.resolve([]);

    // 3. AbuseIPDB (Parallel IPs)
    const abusePromises = ipTargets.map(ip => checkAbuseIPDB(ip));

    // 4. Domain Age (Parallel Domains)
    const agePromises = domainTargets.map(d => getDomainAge(d));

    // 5. MalwareBazaar (Parallel Hashes)
    const mbPromises = hashTargets.map(h => checkMalwareBazaar(h));

    // 6. ThreatFox (Parallel IPs & Domains)
    const tfPromises = [...ipTargets, ...domainTargets].map(t => checkThreatFox(t));

    const [vtResults, gsbResults, abuseResults, ageResults, mbResults, tfResults] = await Promise.all([
        Promise.all(vtPromises),
        gsbPromise,
        Promise.all(abusePromises),
        Promise.all(agePromises),
        Promise.all(mbPromises),
        Promise.all(tfPromises)
    ]);

    // Aggregate VT Results
    vtResults.forEach(r => {
        if (r) results.push({ ...r, provider: 'VirusTotal' });
    });

    // Aggregate AbuseIPDB Results
    abuseResults.forEach(r => {
        if (r) {
            const score = r.abuseConfidenceScore;
            let verdict: ThreatIntelResult['verdict'] = 'clean';
            if (score > 50) verdict = 'malicious';
            else if (score > 0) verdict = 'suspicious';

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
            results.push({
                target: r.domain,
                type: 'domain',
                reputation: r.isFresh ? 75 : 10,
                stats: { malicious: 0, suspicious: r.isFresh ? 1 : 0, harmless: r.isFresh ? 0 : 1, undetected: 0, timeout: 0 },
                lastAnalysisDate: new Date().toISOString(),
                verdict: r.isFresh ? 'suspicious' : 'clean',
                provider: 'DomainAge',
                domainAge: { days: r.ageDays, createdDate: r.createdDate, registrar: r.registrar }
            });
        }
    });

    // Aggregate MalwareBazaar Results
    mbResults.forEach((r, idx) => {
        if (r) {
            results.push({
                target: hashTargets[idx],
                type: 'hash',
                reputation: 100,
                stats: { malicious: 1, suspicious: 0, harmless: 0, undetected: 0, timeout: 0 },
                lastAnalysisDate: new Date().toISOString(),
                verdict: 'malicious',
                provider: 'MalwareBazaar',
                error: r.signature ? `Signature: ${r.signature}` : undefined
            });
        }
    });

    // Aggregate ThreatFox Results
    tfResults.forEach((r, idx) => {
        // ThreatFox returns an array of IOCs if found, or null/empty array if clean
        if (r && r.length > 0) {
            const ioc = r[0]; // Take the first match
            const target = [...ipTargets, ...domainTargets][idx];

            results.push({
                target: target,
                type: ioc.ioc.includes('.') && !ioc.ioc.match(/^\d/) ? 'domain' : 'ip',
                reputation: ioc.confidence_level || 100,
                stats: { malicious: 1, suspicious: 0, harmless: 0, undetected: 0, timeout: 0 },
                lastAnalysisDate: ioc.first_seen,
                verdict: 'malicious',
                provider: 'ThreatFox',
                error: `Malware: ${ioc.malware_alias}`
            });
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
                body: formData,
                headers: {
                    'User-Agent': 'MXLens-Security-Analyzer/1.0'
                }
            });
            if (!res.ok) {
                return { host, count: 0, found: false, error: `API Error ${res.status}` };
            }
            const json = await res.json();
            if (json.query_status === 'ok' && json.urls && json.urls.length > 0) {
                return { host, count: json.urls.length, found: true };
            }
            return { host, count: 0, found: false };
        } catch (e) {
            return { host, count: 0, found: false, error: 'Connection Failed' };
        }
    });

    const uhResults = await Promise.all(uhPromises);

    // 6. PhishTank Check (Public API)
    // POST https://checkurl.phishtank.com/checkurl/
    const ptPromises = [...domainTargets].map(async (domain) => {
        // We can't easily check just "domain" against PhishTank, it expects full URLs usually.
        // But for this purpose, we'll strip protocols and check "http://domain" and "https://domain"
        // Or if we have full URLs extracted, we should use those. 
        // For now, we only have domains/IPs passed to this function.
        // Let's check "http://" + domain as a heuristic.
        try {
            const formData = new FormData();
            formData.append('url', `http://${domain}`);
            formData.append('format', 'json');
            const res = await fetch('https://checkurl.phishtank.com/checkurl/', {
                method: 'POST',
                body: formData,
                headers: {
                    'User-Agent': 'MXLens-Security-Analyzer/1.0'
                }
            });
            if (!res.ok) {
                return { target: domain, valid: false, found: false, error: `API Error ${res.status}` };
            }
            const json = await res.json();
            if (json.results && json.results.in_database) {
                return { target: domain, valid: json.results.valid, found: true };
            }
            return { target: domain, valid: false, found: false };
        } catch {
            return { target: domain, valid: false, found: false, error: 'Connection Failed' };
        }
    });

    const ptResults = await Promise.all(ptPromises);

    // Merge PhishTank Results
    ptResults.forEach(r => {
        if (r) {
            // Always add as a separate entry to show that PhishTank was checked
            results.push({
                target: r.target,
                type: 'domain',
                reputation: r.found ? 100 : 0,
                stats: { malicious: r.found ? 1 : 0, suspicious: 0, harmless: r.found ? 0 : 1, undetected: 0, timeout: 0 },
                lastAnalysisDate: new Date().toISOString(),
                verdict: r.error ? 'unknown' : (r.found ? 'malicious' : 'clean'),
                provider: 'PhishTank',
                error: r.error
            });
        }
    });

    uhResults.forEach(r => {
        if (r) {
            // Always add as a separate entry to show that URLhaus was checked
            results.push({
                target: r.host,
                type: r.host.includes('.') && !r.host.match(/^\d/) ? 'domain' : 'ip',
                reputation: r.found ? 100 : 0,
                stats: { malicious: r.found ? r.count : 0, suspicious: 0, harmless: r.found ? 0 : 1, undetected: 0, timeout: 0 },
                lastAnalysisDate: new Date().toISOString(),
                verdict: r.error ? 'unknown' : (r.found ? 'malicious' : 'clean'),
                provider: 'URLhaus',
                error: r.error
            });
        }
    });

    return results;
}
