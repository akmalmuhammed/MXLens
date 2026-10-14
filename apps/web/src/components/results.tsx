"use client";

import { useState } from "react";
import type { AnalysisResult, Finding, AuthResult } from "@mxlens/engine";
import { defang } from "@mxlens/engine";
import { SafePreview } from "./SafePreview";

function copy(text: string, onDone: () => void) {
    navigator.clipboard?.writeText(text).then(onDone, () => {});
}

export function FindingsCard({ findings }: { findings: Finding[] }) {
    return (
        <div className="card">
            <h2>Findings <span className="count">{findings.length}</span></h2>
            {findings.length === 0 ? (
                <div className="empty-good">
                    <div className="big">No phishing indicators found</div>
                    <p style={{ marginTop: 6, fontSize: 13 }}>This is not a guarantee the message is safe — check the coverage below for what was and was not examined.</p>
                </div>
            ) : (
                findings.map((f) => (
                    <div className={`finding s-${f.severity}`} key={f.ruleId}>
                        <div className="finding-top">
                            <span className={`sev ${f.severity}`}>{f.severity}</span>
                            <span className="finding-id">{f.ruleId}</span>
                            <span className="finding-title">{f.title}</span>
                        </div>
                        <div className="finding-sum">{f.summary}</div>
                        {f.evidence.length > 0 && (
                            <div className="evidence">
                                {f.evidence.map((e, i) => (
                                    <div className="ev" key={i}>
                                        <span className="k">{e.label}</span>
                                        <span className="v">{e.value}{e.note ? <span className="note"> — {e.note}</span> : null}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {f.attack.length > 0 && (
                            <div className="attack">
                                {f.attack.map((t) => (
                                    <a className="tech" key={t.id} href={`https://attack.mitre.org/techniques/${t.id.replace(".", "/")}/`} target="_blank" rel="noopener noreferrer" title={t.name}>{t.id}</a>
                                ))}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}

function authClass(r: AuthResult): string {
    if (r === "pass") return "pass";
    if (r === "fail" || r === "softfail" || r === "permerror") return "fail";
    return "none";
}

export function IdentityCard({ result }: { result: AnalysisResult }) {
    const m = result.message;
    const a = result.authentication;
    const dkim = a.dkim.length ? a.dkim : [{ result: "none" as AuthResult, domain: null, selector: null }];
    return (
        <div className="card">
            <h2>Identity &amp; authentication</h2>
            <div className="kv">
                {m.from && <div className="kv-row"><span className="k">From</span><span className="v">{m.from.name ? `${m.from.name} ` : ""}&lt;{m.from.address}&gt;</span></div>}
                {m.replyTo.length > 0 && <div className="kv-row"><span className="k">Reply-To</span><span className="v">{m.replyTo.map((r) => r.address).join(", ")}</span></div>}
                {m.returnPath && <div className="kv-row"><span className="k">Return-Path</span><span className="v dim">{m.returnPath}</span></div>}
                {result.identity.fromOrgDomain && <div className="kv-row"><span className="k">Org domain</span><span className="v">{result.identity.fromOrgDomain}{result.identity.freemail ? " (free webmail)" : ""}{result.identity.brand ? ` · ${result.identity.brand}` : ""}</span></div>}
                {m.subject && <div className="kv-row"><span className="k">Subject</span><span className="v dim">{m.subject}</span></div>}
            </div>
            <div className="auth-chips">
                <span className={`chip ${authClass(a.spf.result)}`}><b>SPF</b> {a.spf.result}</span>
                {dkim.map((d, i) => <span className={`chip ${authClass(d.result)}`} key={i}><b>DKIM</b> {d.result}{d.domain ? ` ${d.domain}` : ""}</span>)}
                <span className={`chip ${authClass(a.dmarc.result)}`}><b>DMARC</b> {a.dmarc.result}{a.dmarc.policy ? ` p=${a.dmarc.policy}` : ""}</span>
                {a.arc.result !== "none" && <span className={`chip ${authClass(a.arc.result)}`}><b>ARC</b> {a.arc.result}</span>}
            </div>
            <div className="align-note">
                Alignment to {result.identity.fromOrgDomain ?? "the From domain"}: DKIM {a.alignment.dkim ? "aligned" : "not aligned"}, SPF {a.alignment.spf ? "aligned" : "not aligned"}.
            </div>
            {a.trust === "assumed" && a.present && (
                <div className="trust-note">⚠ Authentication-Results were read from the message ({a.authservId}) but not independently verified. Configure your trusted gateway, or use the CLI with --verify-auth, for a stronger guarantee.</div>
            )}
            {!a.present && <div className="trust-note">⚠ No Authentication-Results header — SPF, DKIM and DMARC outcomes are unknown.</div>}
        </div>
    );
}

export function IndicatorsCard({ result }: { result: AnalysisResult }) {
    const [copied, setCopied] = useState<string | null>(null);
    const flaggedUrls = new Map(result.links.filter((l) => l.flags.length).map((l) => [l.url, l.flags]));
    const rows: { type: string; value: string; flagged?: boolean }[] = [
        ...result.indicators.urls.map((v) => ({ type: "url", value: v, flagged: flaggedUrls.has(v) })),
        ...result.indicators.domains.map((v) => ({ type: "domain", value: v })),
        ...result.indicators.ips.map((v) => ({ type: "ip", value: v })),
        ...result.indicators.sha256.map((v) => ({ type: "sha256", value: v })),
    ];
    if (rows.length === 0) return null;
    return (
        <div className="card">
            <h2>Indicators <span className="count">{rows.length} · defanged</span></h2>
            <div>
                {rows.map((r, i) => (
                    <div className="ioc" key={i}>
                        <span className="type">{r.type}</span>
                        <span className="val">{r.type === "ip" || r.type === "sha256" ? r.value : defang(r.value)}</span>
                        {r.flagged && <span className="flag">flagged</span>}
                        <button className="copybtn" onClick={() => copy(r.value, () => { setCopied(r.value); setTimeout(() => setCopied(null), 1200); })}>{copied === r.value ? "✓" : "copy"}</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function DeliveryCard({ result }: { result: AnalysisResult }) {
    const hops = result.delivery.hops;
    if (hops.length === 0) return null;
    return (
        <div className="card">
            <h2>Delivery path <span className="count">{hops.length} hops</span></h2>
            {hops.map((h) => (
                <div className="hop" key={h.index}>
                    <span className="n">{h.index}</span>
                    <span className="host">{h.from ?? h.by ?? "unknown"}{h.ip ? <span className="ip"> [{h.ip}]</span> : null}</span>
                    <span className="delay">{h.delaySeconds !== null ? `+${h.delaySeconds}s` : ""}</span>
                </div>
            ))}
        </div>
    );
}

export function SourceCard({ result, raw }: { result: AnalysisResult; raw: string }) {
    const tabs = ["Headers", result.bodyHtml ? "Safe preview" : null, "Raw"].filter(Boolean) as string[];
    const [tab, setTab] = useState(0);
    const headerLines = raw.split(/\r?\n\r?\n/)[0] ?? raw.slice(0, 4000);
    return (
        <div className="card">
            <div className="tabs" role="tablist">
                {tabs.map((t, i) => (
                    <button key={t} className="tab" role="tab" aria-selected={tab === i} onClick={() => setTab(i)}>{t}</button>
                ))}
            </div>
            <div className="tabpanel">
                {tabs[tab] === "Headers" && <pre className="raw">{headerLines}</pre>}
                {tabs[tab] === "Safe preview" && result.bodyHtml && <SafePreview html={result.bodyHtml} />}
                {tabs[tab] === "Raw" && <pre className="raw">{raw.length > 60000 ? raw.slice(0, 60000) + "\n… truncated" : raw}</pre>}
            </div>
        </div>
    );
}

export function CoverageCard({ result }: { result: AnalysisResult }) {
    return (
        <div className="card coverage">
            <h2>Coverage</h2>
            <div className="checked">
                {result.coverage.checked.map((c) => <span key={c}>✓ {c}</span>)}
            </div>
            {result.coverage.skipped.length > 0 && (
                <div className="skipped">
                    {result.coverage.skipped.map((s, i) => <div key={i}><b style={{ color: "var(--text-dim)" }}>{s.check}:</b> {s.reason}</div>)}
                </div>
            )}
        </div>
    );
}
