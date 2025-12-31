"use server";

import dns from "dns/promises";

export interface MxRecord {
    exchange: string;
    priority: number;
}

export async function resolveMxRecords(domain: string): Promise<MxRecord[]> {
    if (!domain) return [];

    try {
        const records = await dns.resolveMx(domain);
        return records.sort((a, b) => a.priority - b.priority);
    } catch (error) {
        console.error(`DNS MX lookup failed for ${domain}:`, error);
        return [];
    }
}
