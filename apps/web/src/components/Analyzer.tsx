"use client";

import { useCallback, useRef, useState } from "react";
import { analyzeEmail, toMarkdown, toStix, type AnalysisResult } from "@mxlens/engine";
import { FindingsCard, IdentityCard, IndicatorsCard, DeliveryCard, SourceCard, CoverageCard } from "./results";

type State =
    | { phase: "idle" }
    | { phase: "scanning" }
    | { phase: "done"; result: AnalysisResult; raw: string }
    | { phase: "error"; message: string };

function download(name: string, text: string, type: string) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
}

export function Analyzer() {
    const [state, setState] = useState<State>({ phase: "idle" });
    const [paste, setPaste] = useState("");
    const [drag, setDrag] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);

    const run = useCallback(async (raw: string) => {
        if (!raw.trim()) return;
        setState({ phase: "scanning" });
        try {
            // Yield so the scanning state paints before the (synchronous-ish) parse.
            await new Promise((r) => setTimeout(r, 180));
            const result = await analyzeEmail(raw);
            setState({ phase: "done", result, raw });
            requestAnimationFrame(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
        } catch (error) {
            setState({ phase: "error", message: error instanceof Error ? error.message : "Could not parse this input as an email." });
        }
    }, []);

    const onFiles = useCallback((files: FileList | null) => {
        const file = files?.[0];
        if (!file) return;
        if (file.size > 25 * 1024 * 1024) { setState({ phase: "error", message: "File is larger than 25 MB." }); return; }
        file.text().then(run);
    }, [run]);

    const loadSample = useCallback((which: string) => {
        fetch(`/samples/${which}`).then((r) => r.text()).then(run).catch(() => setState({ phase: "error", message: "Could not load the sample." }));
    }, [run]);

    function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 1400); }

    function reset() { setState({ phase: "idle" }); setPaste(""); }

    return (
        <>
            <section className="hero wrap">
                <h1>See what an email <span className="scan">really is</span> before you click.</h1>
                <p className="lede">
                    Drop an <code>.eml</code> file or paste the raw message. MXLens parses the headers, checks SPF, DKIM and DMARC alignment, inspects every link and attachment, and explains its verdict with evidence you can act on.
                </p>
                <div className="assurance"><span className="dot" /> Parsing and scoring run in your browser — the message is never uploaded.</div>

                {state.phase !== "done" && (
                    <div className="intake">
                        <div
                            className={`dropzone${drag ? " drag" : ""}`}
                            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                            onDragLeave={() => setDrag(false)}
                            onDrop={(e) => { e.preventDefault(); setDrag(false); onFiles(e.dataTransfer.files); }}
                        >
                            <div>
                                <div className="dz-title">Drop an email here</div>
                                <div className="dz-sub">.eml or .txt, up to 25 MB · stays on your device</div>
                                <div className="dz-actions">
                                    <button className="btn" onClick={() => fileInput.current?.click()}>Choose file</button>
                                </div>
                            </div>
                            <input ref={fileInput} type="file" accept=".eml,.txt,message/rfc822,text/plain" hidden onChange={(e) => onFiles(e.target.files)} />
                        </div>

                        <textarea
                            className="paste"
                            placeholder="…or paste the raw email here (full source, or just the headers)"
                            value={paste}
                            onChange={(e) => setPaste(e.target.value)}
                        />

                        <div className="intake-row">
                            <button className="btn primary" disabled={!paste.trim() && state.phase === "scanning"} onClick={() => run(paste)}>Analyze email</button>
                            <span className="samples">
                                or try a sample:
                                <button className="btn ghost sm" onClick={() => loadSample("demo-phishing.eml")}>phishing</button>
                                <button className="btn ghost sm" onClick={() => loadSample("demo-legitimate.eml")}>legitimate</button>
                            </span>
                        </div>

                        {state.phase === "scanning" && (
                            <div className="scanning"><span>analyzing</span><span className="scanline" /></div>
                        )}
                        {state.phase === "error" && <div className="error-box">{state.message}</div>}
                    </div>
                )}
            </section>

            {state.phase === "done" && (
                <section className="results wrap" id="results">
                    <Verdict result={state.result} onReset={reset} onDownload={(fmt) => {
                        const r = state.result;
                        const base = (r.message.subject ?? "email").replace(/[^a-z0-9]+/gi, "-").slice(0, 40).toLowerCase() || "email";
                        if (fmt === "json") download(`mxlens-${base}.json`, JSON.stringify(r, null, 2), "application/json");
                        if (fmt === "markdown") download(`mxlens-${base}.md`, toMarkdown(r), "text/markdown");
                        if (fmt === "stix") download(`mxlens-${base}.stix.json`, JSON.stringify(toStix(r), null, 2), "application/json");
                        if (fmt === "copy") navigator.clipboard?.writeText(toMarkdown(r)).then(() => flash("Summary copied"));
                    }} />
                    <div className="grid-2">
                        <div style={{ display: "grid", gap: 18 }}>
                            <FindingsCard findings={state.result.findings} />
                            <SourceCard result={state.result} raw={state.raw} />
                        </div>
                        <div style={{ display: "grid", gap: 18 }}>
                            <IdentityCard result={state.result} />
                            <IndicatorsCard result={state.result} />
                            <DeliveryCard result={state.result} />
                            <CoverageCard result={state.result} />
                        </div>
                    </div>
                </section>
            )}
            {toast && <div className="toast">{toast}</div>}
        </>
    );
}

function Verdict({ result, onReset, onDownload }: { result: AnalysisResult; onReset: () => void; onDownload: (fmt: "json" | "markdown" | "stix" | "copy") => void }) {
    const pin = { malicious: "var(--crit)", suspicious: "var(--med)", clean: "var(--good)" }[result.verdict];
    return (
        <div className={`verdict v-${result.verdict}`}>
            <div className="verdict-head">
                <div className="verdict-score">
                    <span className="num">{result.riskScore}</span>
                    <span className="den">/ 100 risk</span>
                </div>
                <div className="verdict-main">
                    <div className="verdict-label"><span className="pin" style={{ background: pin }} />{result.verdictLabel}</div>
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
