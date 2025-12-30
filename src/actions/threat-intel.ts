
"use server";

import { checkIPReputation, checkDomainReputation, ThreatIntelResult } from "@/lib/threat-intel/virustotal";

/**
 * Server Action to check multiple targets against Threat Intel
 */
export async function checkThreatIntel(targets: { type: 'ip' | 'domain', value: string }[]): Promise<ThreatIntelResult[]> {
    const results: ThreatIntelResult[] = [];

    // Limit batch size
    const batch = targets.slice(0, 5);

    for (const target of batch) {
        let result: ThreatIntelResult | null = null;

        if (target.type === 'ip') {
            result = await checkIPReputation(target.value);
        } else if (target.type === 'domain') {
            result = await checkDomainReputation(target.value);
        }

        if (result) {
            results.push(result);
        }
    }

    return results;
}
