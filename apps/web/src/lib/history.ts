"use client";

import { useEffect, useState } from "react";
import type { AnalysisResult, Indicators, Verdict } from "@mxlens/engine";

/**
 * Session history, stored locally in the browser.
 *
 * MXLens analyzes email in the browser and uploads nothing, so the "dashboard"
 * is built entirely from what this device has analyzed, kept in localStorage.
 * It never leaves the machine and can be cleared at any time. Every access is
 * wrapped defensively: storage can be blocked, full, or unavailable.
 */

const KEY = "mxlens:history:v1";
const EVENT = "mxlens:history";
const MAX_RECORDS = 200;
const MAX_BYTES = 3_800_000; // keep well under the ~5 MB localStorage ceiling

export interface HistoryRecord {
    id: string;
    at: number;
    verdict: Verdict;
    verdictLabel: string;
    riskScore: number;
    subject: string | null;
    fromAddress: string | null;
    fromDomain: string | null;
    brand: string | null;
    summary: string[];
    findings: { id: string; severity: string; title: string }[];
    techniques: { id: string; name: string }[];
    indicators: Indicators;
    /** Best-effort copy of the source, so a record can be re-opened in full. */
    raw?: string;
}

function read(): HistoryRecord[] {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as HistoryRecord[]) : [];
    } catch {
        return [];
    }
}

function persist(records: HistoryRecord[]): HistoryRecord[] {
    let list = records.slice(0, MAX_RECORDS);
    try {
        let payload = JSON.stringify(list);
        // Too big: first shed raw bodies from the oldest records, then whole records.
        if (payload.length > MAX_BYTES) {
            list = list.map((r, i) => (i > 12 ? { ...r, raw: undefined } : r));
            payload = JSON.stringify(list);
        }
        while (payload.length > MAX_BYTES && list.length > 1) {
            list = list.slice(0, Math.max(1, Math.floor(list.length * 0.8)));
            payload = JSON.stringify(list);
        }
        localStorage.setItem(KEY, payload);
    } catch {
        /* storage blocked or full — history simply won't persist this session */
    }
    return list;
}

function announce() {
    try {
        window.dispatchEvent(new CustomEvent(EVENT));
    } catch {
        /* no window (SSR) */
    }
}

function uid(): string {
    try {
        return crypto.randomUUID();
    } catch {
        return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    }
}

export function recordFromResult(result: AnalysisResult, raw: string): HistoryRecord {
    const techniques = new Map<string, string>();
    for (const f of result.findings) for (const t of f.attack) techniques.set(t.id, t.name);
    return {
        id: uid(),
        at: Date.now(),
        verdict: result.verdict,
        verdictLabel: result.verdictLabel,
        riskScore: result.riskScore,
        subject: result.message.subject,
        fromAddress: result.message.from?.address ?? null,
        fromDomain: result.identity.fromDomain,
        brand: result.identity.brand,
        summary: result.summary,
        findings: result.findings.map((f) => ({ id: f.ruleId, severity: f.severity, title: f.title })),
        techniques: [...techniques].map(([id, name]) => ({ id, name })),
        indicators: result.indicators,
        raw: raw.length <= 400_000 ? raw : undefined,
    };
}

export function addAnalysis(result: AnalysisResult, raw: string): HistoryRecord {
    const record = recordFromResult(result, raw);
    const next = persist([record, ...read()]);
    announce();
    return next[0] ?? record;
}

export function loadHistory(): HistoryRecord[] {
    return read();
}

export function getRecord(id: string): HistoryRecord | undefined {
    return read().find((r) => r.id === id);
}

export function removeRecord(id: string): void {
    persist(read().filter((r) => r.id !== id));
    announce();
}

export function clearHistory(): void {
    try {
        localStorage.removeItem(KEY);
    } catch {
        /* ignore */
    }
    announce();
}

// --------------------------------------------------------------------------
// Aggregation — the numbers the dashboard is built from
// --------------------------------------------------------------------------

export interface IocEntry {
    type: "url" | "domain" | "ip" | "sha256" | "email";
    value: string;
    count: number;
    /** True if this value appeared in any malicious or suspicious message. */
    flagged: boolean;
}

export interface Aggregate {
    total: number;
    counts: Record<Verdict, number>;
    /** Share of analyzed mail that was malicious or suspicious, 0–100. */
    threatRate: number;
    topScore: number;
    iocs: IocEntry[];
    uniqueIocCount: number;
    techniques: { id: string; name: string; count: number }[];
    rules: { id: string; title: string; count: number }[];
    lastAt: number | null;
}

const EMPTY: Aggregate = {
    total: 0,
    counts: { malicious: 0, suspicious: 0, clean: 0 },
    threatRate: 0,
    topScore: 0,
    iocs: [],
    uniqueIocCount: 0,
    techniques: [],
    rules: [],
    lastAt: null,
};

export function aggregate(records: HistoryRecord[]): Aggregate {
    if (records.length === 0) return EMPTY;
    const counts: Record<Verdict, number> = { malicious: 0, suspicious: 0, clean: 0 };
    const iocs = new Map<string, IocEntry>();
    const techniques = new Map<string, { name: string; count: number }>();
    const rules = new Map<string, { title: string; count: number }>();
    let topScore = 0;

    for (const r of records) {
        counts[r.verdict]++;
        topScore = Math.max(topScore, r.riskScore);
        const threat = r.verdict !== "clean";
        const add = (type: IocEntry["type"], values: string[]) => {
            for (const value of values) {
                const key = `${type}:${value}`;
                const existing = iocs.get(key);
                if (existing) { existing.count++; existing.flagged ||= threat; }
                else iocs.set(key, { type, value, count: 1, flagged: threat });
            }
        };
        add("url", r.indicators.urls);
        add("domain", r.indicators.domains);
        add("ip", r.indicators.ips);
        add("sha256", r.indicators.sha256);
        add("email", r.indicators.emails);
        for (const t of r.techniques) {
            const e = techniques.get(t.id);
            if (e) e.count++; else techniques.set(t.id, { name: t.name, count: 1 });
        }
        for (const f of r.findings) {
            const e = rules.get(f.id);
            if (e) e.count++; else rules.set(f.id, { title: f.title, count: 1 });
        }
    }

    const iocList = [...iocs.values()].sort((a, b) => Number(b.flagged) - Number(a.flagged) || b.count - a.count || a.value.localeCompare(b.value));
    return {
        total: records.length,
        counts,
        threatRate: Math.round(((counts.malicious + counts.suspicious) / records.length) * 100),
        topScore,
        iocs: iocList,
        uniqueIocCount: iocList.length,
        techniques: [...techniques].map(([id, v]) => ({ id, name: v.name, count: v.count })).sort((a, b) => b.count - a.count),
        rules: [...rules].map(([id, v]) => ({ id, title: v.title, count: v.count })).sort((a, b) => b.count - a.count),
        lastAt: records[0]?.at ?? null,
    };
}

/** Subscribe a component to the local history. Updates on add/remove/clear and cross-tab. */
export function useHistory(): HistoryRecord[] {
    const [records, setRecords] = useState<HistoryRecord[]>([]);
    useEffect(() => {
        const sync = () => setRecords(read());
        sync();
        window.addEventListener(EVENT, sync);
        window.addEventListener("storage", sync);
        return () => {
            window.removeEventListener(EVENT, sync);
            window.removeEventListener("storage", sync);
        };
    }, []);
    return records;
}
