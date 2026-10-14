"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { analyzeEmail, defang } from "@mxlens/engine";
import { useHistory, aggregate, addAnalysis, clearHistory, removeRecord, type HistoryRecord, type Aggregate } from "@/lib/history";

type Filter = "all" | "malicious" | "suspicious" | "clean";

function download(name: string, text: string, type: string) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
}

function iocCsv(agg: Aggregate): string {
    const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const rows = [["type", "value", "times_seen", "flagged"], ...agg.iocs.map((i) => [i.type, i.value, String(i.count), i.flagged ? "yes" : "no"])];
    return rows.map((r) => r.map(esc).join(",")).join("\n") + "\n";
}

function timeAgo(ts: number): string {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}

export function Dashboard() {
    const router = useRouter();
    const records = useHistory();
    const agg = useMemo(() => aggregate(records), [records]);
    const [filter, setFilter] = useState<Filter>("all");
    const [toast, setToast] = useState<string | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);

    function flash(m: string) { setToast(m); setTimeout(() => setToast(null), 1600); }

    const shown = useMemo(() => (filter === "all" ? records : records.filter((r) => r.verdict === filter)), [records, filter]);

    function onBulk(files: FileList | null) {
        const list = Array.from(files ?? []).slice(0, 50);
        if (list.length === 0) return;
        Promise.all(list.map(async (f) => {
            try { const raw = await f.text(); const r = await analyzeEmail(raw); addAnalysis(r, raw); return true; } catch { return false; }
        })).then((res) => flash(`Added ${res.filter(Boolean).length} of ${list.length} messages`));
    }

    if (records.length === 0) {
        return (
            <>
                <DashHead agg={agg} empty onBulk={() => fileInput.current?.click()} onExport={() => {}} onClear={() => {}} router={router} />
                <section className="wrap">
                    <div className="empty-state">
                        <div className="big">Your session board is empty</div>
                        <p>Every email you analyze shows up here — a running threat feed, an aggregated indicator sheet, and the ATT&amp;CK techniques you&apos;ve seen. It&apos;s stored only in this browser and never uploaded.</p>
                        <button className="btn primary" onClick={() => router.push("/")}>Analyze your first email</button>
                        <input ref={fileInput} type="file" accept=".eml,.txt,message/rfc822,text/plain" multiple hidden onChange={(e) => onBulk(e.target.files)} />
                        <div style={{ marginTop: 14 }}><button className="btn ghost sm" onClick={() => fileInput.current?.click()}>or bulk-import .eml files</button></div>
                    </div>
                </section>
                {toast && <div className="toast"><span className="ok">✓</span>{toast}</div>}
            </>
        );
    }

    return (
        <>
            <DashHead agg={agg} onBulk={() => fileInput.current?.click()} onExport={() => { download("mxlens-indicators.csv", iocCsv(agg), "text/csv"); flash("Exported all indicators"); }} onClear={() => { if (confirm("Clear all analyses from this browser? This cannot be undone.")) clearHistory(); }} router={router} />
            <input ref={fileInput} type="file" accept=".eml,.txt,message/rfc822,text/plain" multiple hidden onChange={(e) => onBulk(e.target.files)} />

            <section className="wrap" style={{ display: "grid", gap: 16, paddingBottom: 48 }}>
                <Posture agg={agg} />

                <div className="grid-2">
                    <div style={{ display: "grid", gap: 16 }}>
                        <div className="card">
                            <h2>
                                Threat feed <span className="count">{shown.length}</span>
                                <span className="spacer" />
                                <div className="filterbar">
                                    {(["all", "malicious", "suspicious", "clean"] as Filter[]).map((f) => (
                                        <button key={f} className={`filter ${f === "malicious" ? "c-crit" : f === "suspicious" ? "c-sus" : f === "clean" ? "c-clean" : ""}`} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                                            {f === "all" ? "All" : f[0].toUpperCase() + f.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </h2>
                            <div className="feed">
                                {shown.length === 0 ? (
                                    <div className="empty-good" style={{ padding: 28 }}>No {filter} messages in this session.</div>
                                ) : shown.map((r) => (
                                    <FeedRow key={r.id} r={r} onOpen={() => router.push(`/?open=${r.id}`)} onRemove={() => removeRecord(r.id)} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "grid", gap: 16 }}>
                        <IocRollup agg={agg} onCopyAll={() => { navigator.clipboard?.writeText(agg.iocs.map((i) => i.value).join("\n")).then(() => flash("Copied all indicators")); }} onExport={() => { download("mxlens-indicators.csv", iocCsv(agg), "text/csv"); flash("Exported all indicators"); }} />
                        {agg.techniques.length > 0 && <TechniqueCoverage agg={agg} />}
                        {agg.rules.length > 0 && <TopRules agg={agg} />}
                    </div>
                </div>
            </section>
            {toast && <div className="toast"><span className="ok">✓</span>{toast}</div>}
        </>
    );
}

function DashHead({ agg, empty, onBulk, onExport, onClear, router }: { agg: Aggregate; empty?: boolean; onBulk: () => void; onExport: () => void; onClear: () => void; router: ReturnType<typeof useRouter> }) {
    return (
        <div className="wrap page-head">
            <div className="head-row">
                <div>
                    <h1>Session dashboard</h1>
                    <p>Everything you&apos;ve analyzed on this device{agg.lastAt ? ` · last activity ${timeAgo(agg.lastAt)}` : ""}. Stored locally, never uploaded.</p>
                </div>
                <div className="spacer" />
                <button className="btn primary" onClick={() => router.push("/")}>Analyze email</button>
                {!empty && <button className="btn sm" onClick={onBulk}>Bulk import</button>}
                {!empty && <button className="btn sm" onClick={onExport}>Export IOCs</button>}
                {!empty && <button className="btn ghost sm" onClick={onClear}>Clear</button>}
            </div>
        </div>
    );
}

function Posture({ agg }: { agg: Aggregate }) {
    const threats = agg.counts.malicious + agg.counts.suspicious;
    const pct = (n: number) => (agg.total ? (n / agg.total) * 100 : 0);
    return (
        <div className="bento">
            <div className="tile b3 posture">
                <div className="t-label">Threat rate this session</div>
                <div className="ring-wrap" style={{ marginTop: 14 }}>
                    <Ring value={agg.threatRate} />
                    <div className="stat-row">
                        <div className="stat c-crit"><span className="n">{agg.counts.malicious}</span><span className="l">Malicious</span></div>
                        <div className="stat c-med"><span className="n">{agg.counts.suspicious}</span><span className="l">Suspicious</span></div>
                        <div className="stat c-good"><span className="n">{agg.counts.clean}</span><span className="l">Clean</span></div>
                    </div>
                </div>
                <div className="distbar" style={{ marginTop: 18 }}>
                    <i className="crit" style={{ width: `${pct(agg.counts.malicious)}%` }} />
                    <i className="sus" style={{ width: `${pct(agg.counts.suspicious)}%` }} />
                    <i className="clean" style={{ width: `${pct(agg.counts.clean)}%` }} />
                </div>
            </div>
            <div className="tile b1 lift">
                <div className="t-label">Analyzed</div>
                <div className="t-big">{agg.total}</div>
                <div className="t-sub">{threats} flagged for attention</div>
            </div>
            <div className="tile b1 lift">
                <div className="t-label">Peak risk</div>
                <div className="t-big" style={{ color: agg.topScore >= 55 ? "var(--crit)" : agg.topScore >= 25 ? "var(--med)" : "var(--good)" }}>{agg.topScore}</div>
                <div className="t-sub">highest score seen</div>
            </div>
            <div className="tile b1 lift">
                <div className="t-label">Indicators</div>
                <div className="t-big">{agg.uniqueIocCount}</div>
                <div className="t-sub">{agg.iocs.filter((i) => i.flagged).length} flagged</div>
            </div>
        </div>
    );
}

function Ring({ value }: { value: number }) {
    const size = 92, stroke = 8, r = (size - stroke) / 2, c = 2 * Math.PI * r;
    const color = value >= 50 ? "var(--crit)" : value >= 20 ? "var(--med)" : "var(--good)";
    return (
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-4)" strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
                <div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 600, lineHeight: 1, color }}>{value}%</div>
                </div>
            </div>
        </div>
    );
}

function FeedRow({ r, onOpen, onRemove }: { r: HistoryRecord; onOpen: () => void; onRemove: () => void }) {
    const top = r.findings[0];
    return (
        <div className={`feed-row s-${r.verdict}`} role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => { if (e.key === "Enter") onOpen(); }}>
            <span className="feed-score">{r.riskScore}</span>
            <span className="feed-main">
                <span className="feed-subj">{r.subject || "(no subject)"}</span>
                <span className="feed-meta">
                    {r.fromAddress || r.fromDomain || "unknown sender"}
                    {top ? <> · <span className="f-tag">{top.title}</span></> : null}
                </span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="feed-time">{timeAgo(r.at)}</span>
                <button className="copybtn" aria-label="Remove from history" onClick={(e) => { e.stopPropagation(); onRemove(); }}>✕</button>
            </span>
        </div>
    );
}

function IocRollup({ agg, onCopyAll, onExport }: { agg: Aggregate; onCopyAll: () => void; onExport: () => void }) {
    const [copied, setCopied] = useState<string | null>(null);
    const top = agg.iocs.slice(0, 40);
    return (
        <div className="card">
            <h2>
                Indicator rollup <span className="count">{agg.uniqueIocCount}</span>
                <span className="spacer" />
                <button className="copybtn" onClick={onCopyAll} style={{ marginRight: 6 }}>copy all</button>
                <button className="copybtn" onClick={onExport}>CSV</button>
            </h2>
            {top.length === 0 ? <div className="empty-good" style={{ padding: 24 }}>No indicators yet.</div> : top.map((i) => (
                <div className="ioc" key={`${i.type}:${i.value}`}>
                    <span className="type">{i.type}</span>
                    <span className="val">{i.type === "ip" || i.type === "sha256" ? i.value : defang(i.value)}</span>
                    {i.count > 1 && <span className="seen">×{i.count}</span>}
                    {i.flagged && <span className="flag">flagged</span>}
                    <button className="copybtn" onClick={() => { navigator.clipboard?.writeText(i.value); setCopied(i.value); setTimeout(() => setCopied(null), 1000); }}>{copied === i.value ? "✓" : "copy"}</button>
                </div>
            ))}
            {agg.iocs.length > 40 && <div className="align-note" style={{ paddingTop: 12 }}>+{agg.iocs.length - 40} more — export the full set as CSV.</div>}
        </div>
    );
}

function TechniqueCoverage({ agg }: { agg: Aggregate }) {
    return (
        <div className="card">
            <h2>ATT&amp;CK techniques seen <span className="count">{agg.techniques.length}</span></h2>
            <div className="tech-grid">
                {agg.techniques.map((t) => (
                    <a key={t.id} className="tech-cell" href={`https://attack.mitre.org/techniques/${t.id.replace(".", "/")}/`} target="_blank" rel="noopener noreferrer" title={t.name}>
                        <span className="ct">{t.id}</span>
                        <span className="cn">{t.name.length > 26 ? t.name.slice(0, 25) + "…" : t.name}</span>
                        {t.count > 1 && <span className="seen">×{t.count}</span>}
                    </a>
                ))}
            </div>
        </div>
    );
}

function TopRules({ agg }: { agg: Aggregate }) {
    const top = agg.rules.slice(0, 8);
    const max = Math.max(...top.map((r) => r.count), 1);
    return (
        <div className="card">
            <h2>Most-fired rules</h2>
            <div style={{ padding: "12px 17px", display: "grid", gap: 10 }}>
                {top.map((r) => (
                    <div key={r.id} style={{ display: "grid", gap: 5 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                            <span>{r.title}</span>
                            <span style={{ fontFamily: "var(--mono)", color: "var(--text-faint)" }}>{r.count}</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: "var(--surface-3)", overflow: "hidden" }}>
                            <i style={{ display: "block", height: "100%", width: `${(r.count / max) * 100}%`, background: "var(--signal)" }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
