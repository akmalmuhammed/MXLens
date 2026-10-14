"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { analyzeEmail, toMarkdown, toStix, listRules, type AnalysisResult } from "@mxlens/engine";

const RULE_COUNT = listRules().length;
import { addAnalysis, getRecord } from "@/lib/history";
import { FindingsCard, IdentityCard, IndicatorsCard, DeliveryCard, SourceCard, CoverageCard } from "./results";
import { VerdictGauge } from "./VerdictGauge";
import { CapabilityGrid } from "./CapabilityGrid";

type State =
    | { phase: "idle" }
    | { phase: "scanning" }
    | { phase: "done"; result: AnalysisResult; raw: string }
    | { phase: "error"; message: string };

function download(name: string, text: string, type: string) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
}

export function Analyzer() {
    const [state, setState] = useState<State>({ phase: "idle" });
    const [mode, setMode] = useState<"drop" | "paste">("drop");
    const [paste, setPaste] = useState("");
    const [drag, setDrag] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);

    const run = useCallback(async (raw: string, opts?: { persist?: boolean }) => {
        if (!raw.trim()) return;
        setState({ phase: "scanning" });
        try {
            await new Promise((r) => setTimeout(r, 200));
            const result = await analyzeEmail(raw);
            if (opts?.persist !== false) addAnalysis(result, raw);
            setState({ phase: "done", result, raw });
            requestAnimationFrame(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
        } catch (error) {
            setState({ phase: "error", message: error instanceof Error ? error.message : "Could not parse this input as an email." });
        }
    }, []);

    const onFiles = useCallback((files: FileList | null) => {
        const list = Array.from(files ?? []);
        if (list.length === 0) return;
        if (list.length > 1) {
            // Multiple files: analyze all, land them in history, open the riskiest.
            setState({ phase: "scanning" });
            Promise.all(list.slice(0, 50).map(async (f) => {
                const raw = await f.text();
                try { const r = await analyzeEmail(raw); addAnalysis(r, raw); return { r, raw }; } catch { return null; }
            })).then((results) => {
                const ok = results.filter((x): x is { r: AnalysisResult; raw: string } => !!x);
                if (ok.length === 0) { setState({ phase: "error", message: "None of those files could be parsed as email." }); return; }
                const best = ok.sort((a, b) => b.r.riskScore - a.r.riskScore)[0];
                setState({ phase: "done", result: best.r, raw: best.raw });
                flash(`Analyzed ${ok.length} messages — showing the highest risk`);
            });
            return;
        }
        const file = list[0];
        if (file.size > 25 * 1024 * 1024) { setState({ phase: "error", message: "File is larger than 25 MB." }); return; }
        file.text().then((t) => run(t));
    }, [run]);

    const loadSample = useCallback((which: string) => {
        fetch(`/samples/${which}`).then((r) => r.text()).then((t) => run(t)).catch(() => setState({ phase: "error", message: "Could not load the sample." }));
    }, [run]);

    // Handle ?sample= and ?open= (from the command palette) once on mount.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sample = params.get("sample");
        const open = params.get("open");
        if (sample && /^[a-z0-9._-]+$/i.test(sample)) {
            loadSample(sample);
        } else if (open) {
            const rec = getRecord(open);
            if (rec?.raw) run(rec.raw, { persist: false });
        }
        if (sample || open) window.history.replaceState({}, "", window.location.pathname);
    }, [loadSample, run]);

    function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 1600); }
    function reset() { setState({ phase: "idle" }); setPaste(""); }

    const showIntake = state.phase !== "done";

    return (
        <>
            <section className="hero wrap">
                <span className="eyebrow"><span className="dot" /> Runs in your browser · nothing uploaded</span>
                <h1>Resolve any email into labeled evidence.</h1>
                <p className="lede">
                    Drop an <code>.eml</code> or paste the raw source. MXLens parses the headers, verifies SPF, DKIM and DMARC alignment, inspects every link and attachment, and returns an explained verdict — with the evidence behind every finding.
                </p>
                <div className="caps">
                    <span className="cap"><b>{RULE_COUNT}</b> detection rules</span>
                    <span className="cap">SPF / DKIM / DMARC alignment</span>
                    <span className="cap">MITRE ATT&amp;CK mapped</span>
                </div>

                {showIntake && (
                    <div className="intake">
                        <div className="console">
                            <div className="console-bar">
                                <div className="tab-row" role="tablist" aria-label="Input mode">
                                    <button className="console-tab" role="tab" aria-selected={mode === "drop"} onClick={() => setMode("drop")}>Drop file</button>
                                    <button className="console-tab" role="tab" aria-selected={mode === "paste"} onClick={() => setMode("paste")}>Paste source</button>
                                </div>
                                <span className="lock"><span className="dot" /> local</span>
                            </div>

                            {mode === "drop" ? (
                                <div
                                    className={`dropzone${drag ? " drag" : ""}`}
                                    onClick={() => fileInput.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                                    onDragLeave={() => setDrag(false)}
                                    onDrop={(e) => { e.preventDefault(); setDrag(false); onFiles(e.dataTransfer.files); }}
                                    role="button" tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.current?.click(); } }}
                                >
                                    <div>
                                        <div className="dz-ring" aria-hidden="true">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 16V4M12 4L7 9M12 4l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                                        </div>
                                        <div className="dz-title">Drop an email to analyze</div>
                                        <div className="dz-sub">.eml or .txt · one or many · up to 25 MB · stays on your device</div>
                                        <div className="dz-actions">
                                            <span className="btn">Choose file</span>
                                        </div>
                                    </div>
                                    <input ref={fileInput} type="file" accept=".eml,.txt,message/rfc822,text/plain" multiple hidden onChange={(e) => onFiles(e.target.files)} />
                                </div>
                            ) : (
                                <textarea
                                    className="paste"
                                    aria-label="Raw email source"
                                    placeholder={"Paste the raw email here — full source, or just the headers.\n\nFrom: ...\nTo: ...\nReceived: ...\nAuthentication-Results: ..."}
                                    value={paste}
                                    onChange={(e) => setPaste(e.target.value)}
                                />
                            )}
                        </div>

                        <div className="intake-row">
                            {mode === "paste" && (
                                <button className="btn primary" disabled={!paste.trim()} onClick={() => run(paste)}>Analyze email</button>
                            )}
                            <span className="samples">
                                Try a sample:
                                <button className="btn ghost sm" onClick={() => loadSample("demo-phishing.eml")}>phishing</button>
                                <button className="btn ghost sm" onClick={() => loadSample("demo-legitimate.eml")}>legitimate</button>
                            </span>
                        </div>

                        {state.phase === "scanning" && (
                            <div className="scanning"><span>resolving</span><span className="scanline" /><span>parsing · authenticating · scoring</span></div>
                        )}
                        {state.phase === "error" && <div className="error-box">{state.message}</div>}
                    </div>
                )}
            </section>

            {showIntake && state.phase === "idle" && <CapabilityGrid />}

            {state.phase === "done" && (
                <section className="results wrap reveal" id="results" style={{ display: "grid", gap: 16, paddingBottom: 40 }}>
                    <Verdict result={state.result} onReset={reset} onDownload={(fmt) => {
                        const r = state.result;
                        const base = (r.message.subject ?? "email").replace(/[^a-z0-9]+/gi, "-").slice(0, 40).toLowerCase() || "email";
                        if (fmt === "json") download(`mxlens-${base}.json`, JSON.stringify(r, null, 2), "application/json");
                        if (fmt === "markdown") download(`mxlens-${base}.md`, toMarkdown(r), "text/markdown");
                        if (fmt === "stix") download(`mxlens-${base}.stix.json`, JSON.stringify(toStix(r), null, 2), "application/json");
                        if (fmt === "copy") navigator.clipboard?.writeText(toMarkdown(r)).then(() => flash("Summary copied to clipboard"));
                    }} />
                    <div className="grid-2">
                        <div style={{ display: "grid", gap: 16 }}>
                            <FindingsCard findings={state.result.findings} />
                            <SourceCard result={state.result} raw={state.raw} />
                        </div>
                        <div style={{ display: "grid", gap: 16 }}>
                            <IdentityCard result={state.result} />
                            <IndicatorsCard result={state.result} />
                            <DeliveryCard result={state.result} />
                            <CoverageCard result={state.result} />
                        </div>
                    </div>
                </section>
            )}
            {toast && <div className="toast"><span className="ok">✓</span>{toast}</div>}
        </>
    );
}

function Verdict({ result, onReset, onDownload }: { result: AnalysisResult; onReset: () => void; onDownload: (fmt: "json" | "markdown" | "stix" | "copy") => void }) {
    const pin = { malicious: "var(--crit)", suspicious: "var(--med)", clean: "var(--good)" }[result.verdict];
    return (
        <div className={`verdict v-${result.verdict}`}>
            <div className="verdict-head">
                <VerdictGauge score={result.riskScore} verdict={result.verdict} />
                <div className="verdict-main">
                    <div className="verdict-label"><span className="pin" style={{ background: pin, color: pin }} />{result.verdictLabel}</div>
                    <ul className="verdict-sum">
                        {result.summary.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                </div>
            </div>
            <div className="verdict-actions">
                <button className="btn sm" onClick={() => onDownload("copy")}>Copy summary</button>
                <button className="btn sm" onClick={() => onDownload("markdown")}>Markdown</button>
                <button className="btn sm" onClick={() => onDownload("json")}>JSON</button>
                <button className="btn sm" onClick={() => onDownload("stix")}>STIX 2.1</button>
                <button className="btn ghost sm" style={{ marginLeft: "auto" }} onClick={onReset}>Analyze another</button>
            </div>
        </div>
    );
}
