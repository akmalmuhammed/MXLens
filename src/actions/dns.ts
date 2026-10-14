"use server";

import dns from "dns/promises";
import { allowEnrichment, isPublicDomain } from "@/lib/security/enrichment-guard";

export interface MxRecord {
    exchange: string;
    priority: number;
}

export async function resolveMxRecords(domain: string): Promise<MxRecord[]> {
    if (typeof domain !== "string" || !isPublicDomain(domain)) return [];
    if (!(await allowEnrichment("dns", 30))) return [];

    try {
        const records = await dns.resolveMx(domain);
        return records.sort((a, b) => a.priority - b.priority);
    } catch (error) {
        console.error(`DNS MX lookup failed for ${domain}:`, error);
        return [];
    }
}
