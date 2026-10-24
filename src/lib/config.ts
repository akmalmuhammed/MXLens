import "server-only";

/**
 * Runtime configuration. Every setting is optional: with an empty environment
 * MXLens analyzes emails entirely in the browser and makes no outbound calls.
 */

/** Threat-intel, geolocation and DNS lookups. Off unless explicitly enabled. */
export function isEnrichmentEnabled(): boolean {
    return process.env.MXLENS_ENRICHMENT === "true";
}
