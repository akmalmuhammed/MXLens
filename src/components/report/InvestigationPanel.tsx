"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Report, Tone } from "@/lib/report/buildReport";
import type { Answer, InvestigationQuestion } from "@/lib/investigation/Investigation";
import { defangText, investigationToMarkdown } from "@/lib/investigation/markdown";
import { CopyButton, Eyebrow, Panel, Pill, TONE_STYLES } from "./primitives";

/** Whether "yes" is good or bad news depends on the question. */
const YES_IS_BAD = new Set<InvestigationQuestion["id"]>(["malicious", "spoofed", "targeted", "delivered"]);

function toneFor(q: InvestigationQuestion): Tone {
    const answer: Answer = q.answer;
    if (q.id === "sender" || q.id === "ask") return answer === "unclear" ? "neutral" : q.id === "ask" && answer === "yes" ? "warn" : "neutral";
    if (answer === "unclear") return "neutral";
    const positive = answer === "yes" || answer === "likely";
    if (YES_IS_BAD.has(q.id)) return positive ? (answer === "yes" ? "fail" : "warn") : "pass";
    return positive ? "pass" : "warn";
}

const WHEN_LABEL = { now: "Now", next: "Next", harden: "Prevent a repeat" } as const;

export function InvestigationPanel({ report, defanged }: { report: Report; defanged: boolean }) {
    const inv = report.investigation;
    const d = (s: string) => (defanged ? defangText(s) : s);
    const markdown = useMemo(() => investigationToMarkdown(inv, { defang: defanged, title: report.message.subject }), [inv, defanged, report.message.subject]);
    const iocText = useMemo(() => inv.iocs.filter(i => i.block).map(i => `${i.type}\t${defanged ? defangText(i.value) : i.value}\t${i.role}`).join("\n"), [inv.iocs, defanged]);
    const [done, setDone] = useState<Set<number>>(new Set());
    const clean = inv.attack.id === "none";

    return (
        <Panel
            id="investigation"
            title="Investigation"
            aside={<CopyButton value={markdown} label="Copy write-up" />}
        >
            <div className="space-y-6">
                {/* What happened */}
                <section aria-labelledby="inv-what">
                    <p id="inv-what" className={cn("text-[15px] font-semibold leading-snug", clean ? "text-sev-pass" : "text-foreground")}>{d(inv.headline)}</p>
                    <ul className="mt-2.5 space-y-1.5">
                        {inv.narrative.map(line => (
                            <li key={line} className="flex gap-2 text-sm leading-relaxed text-foreground/85">
                                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sev-info" aria-hidden />
                                <span className="min-w-0 break-words">{d(line)}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Key questions */}
                <section>
                    <Eyebrow className="mb-2">Key questions</Eyebrow>
                    <div className="divide-y divide-hairline rounded-lg border border-hairline">
                        {inv.questions.map(q => (
                            <details key={q.id} className="group" open={q.id === "spoofed" || q.id === "malicious"}>
                                <summary className="flex cursor-pointer list-none items-start gap-3 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
                                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" aria-hidden />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="text-sm font-medium text-foreground">{q.question}</span>
                                            <Pill className={TONE_STYLES[toneFor(q)]}>{q.label}</Pill>
                                        </div>
                                        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{d(q.summary)}</p>
                                    </div>
                                </summary>
                                {q.evidence.length > 0 && (
                                    <ul className="space-y-1 px-10 pb-3">
                                        {q.evidence.map(e => (
                                            <li key={e} className="break-words font-mono text-[11.5px] leading-relaxed text-muted-foreground">· {d(e)}</li>
                                        ))}
                                    </ul>
                                )}
                            </details>
                        ))}
                    </div>
                </section>

                {/* Authentication by stage */}
                {inv.authentication.length > 0 && (
                    <section>
                        <Eyebrow className="mb-2">Authentication, as each server saw it</Eyebrow>
                        <div className="overflow-x-auto rounded-lg border border-hairline">
                            <table className="w-full min-w-[520px] text-left text-[12.5px]">
                                <thead className="bg-foreground/[0.03] font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-2 font-medium">Stage</th>
                                        <th className="px-3 py-2 font-medium">SPF</th>
                                        <th className="px-3 py-2 font-medium">DKIM</th>
                                        <th className="px-3 py-2 font-medium">DMARC</th>
                                        <th className="px-3 py-2 font-medium">Checked IP</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-hairline">
                                    {inv.authentication.map(a => (
                                        <tr key={a.stage} className="align-top">
                                            <td className="px-3 py-2">
                                                <div className="font-medium text-foreground">{a.stage === "edge" ? "First server" : "Final server"}</div>
                                                <div className="font-mono text-[11px] text-muted-foreground">{d(a.evaluator)}</div>
                                                <div className="mt-1 text-[11.5px] text-muted-foreground">{d(a.note)}</div>
                                            </td>
                                            <td className="px-3 py-2 font-mono">{a.spf}</td>
                                            <td className="px-3 py-2 font-mono">{a.dkim}</td>
                                            <td className="px-3 py-2 font-mono">{a.dmarc}</td>
                                            <td className="px-3 py-2 font-mono text-muted-foreground">{a.checkedIp ? d(a.checkedIp) : "–"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* Why it got through */}
                {inv.whyDelivered.length > 0 && (
                    <section>
                        <Eyebrow className="mb-2">Why it was not blocked</Eyebrow>
                        <ul className="space-y-2">
                            {inv.whyDelivered.map(g => (
                                <li key={g.gap} className="rounded-lg border border-sev-medium/25 bg-sev-medium/[0.04] px-3 py-2">
                                    <p className="text-[13px] text-foreground/90">{d(g.gap)}</p>
                                    <p className="mt-1 text-[12.5px] text-muted-foreground"><span className="font-medium text-sev-pass">Fix:</span> {d(g.fix)}</p>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* ATT&CK */}
                {inv.techniques.length > 0 && (
                    <section>
                        <Eyebrow className="mb-2">MITRE ATT&amp;CK</Eyebrow>
                        <div className="flex flex-wrap gap-1.5">
                            {inv.techniques.map(t => (
                                <span key={t.id} title={t.evidence} className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[12px]">
                                    <span className="font-mono text-sev-info">{t.id}</span>
                                    <span className="text-foreground/85">{t.name}</span>
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                {/* Indicators with roles */}
                {inv.iocs.length > 0 && !clean && (
                    <section>
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <Eyebrow>Indicators and their role</Eyebrow>
                            {iocText && <CopyButton value={iocText} label="Copy blockable" />}
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-hairline">
                            <table className="w-full min-w-[520px] text-left text-[12.5px]">
                                <tbody className="divide-y divide-hairline">
                                    {inv.iocs.map(i => (
                                        <tr key={`${i.type}:${i.value}`} className="align-top">
                                            <td className="w-20 px-3 py-1.5 font-mono text-[10.5px] uppercase text-muted-foreground">{i.type}</td>
                                            <td className="max-w-[360px] break-all px-3 py-1.5 font-mono text-[11.5px] text-foreground/90">
                                                {["subject", "message-id", "sha256", "phone"].includes(i.type) || !defanged ? i.value : defangText(i.value)}
                                            </td>
                                            <td className="px-3 py-1.5 text-[12px] text-muted-foreground">{i.role}</td>
                                            <td className="px-3 py-1.5 text-right">
                                                {i.block ? <Pill className={TONE_STYLES.fail}>block</Pill> : <Pill className={TONE_STYLES.neutral}>context</Pill>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* Response */}
                {inv.actions.length > 0 && (
                    <section>
                        <Eyebrow className="mb-2">Response</Eyebrow>
                        <div className="space-y-3">
                            {(["now", "next", "harden"] as const).map(when => {
                                const items = inv.actions.map((a, i) => ({ ...a, i })).filter(a => a.when === when);
                                if (!items.length) return null;
                                return (
                                    <div key={when}>
                                        <div className="mb-1 text-[12px] font-semibold text-foreground/80">{WHEN_LABEL[when]}</div>
                                        <ul className="space-y-0.5">
                                            {items.map(a => {
                                                const checked = done.has(a.i);
                                                return (
                                                    <li key={a.i}>
                                                        <button
                                                            type="button"
                                                            role="checkbox"
                                                            aria-checked={checked}
                                                            onClick={() => setDone(prev => {
                                                                const next = new Set(prev);
                                                                if (next.has(a.i)) next.delete(a.i);
                                                                else next.add(a.i);
                                                                return next;
                                                            })}
                                                            className="-mx-2 flex w-[calc(100%+1rem)] items-start gap-3 rounded-lg px-2 py-1 text-left text-[13px] hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sev-info/50"
                                                        >
                                                            <span className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border", checked ? "border-sev-pass bg-sev-pass text-background" : "border-foreground/25")}>
                                                                {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                                                            </span>
                                                            <span className={cn("leading-snug", checked ? "text-muted-foreground line-through" : "text-foreground/90")}>{d(a.text)}</span>
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Hunting */}
                {inv.hunting.length > 0 && !clean && (
                    <section>
                        <Eyebrow className="mb-2">Hunting and purge queries</Eyebrow>
                        <div className="space-y-2">
                            {inv.hunting.map(h => (
                                <details key={h.id} className="group rounded-lg border border-hairline">
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 [&::-webkit-details-marker]:hidden">
                                        <span className="flex min-w-0 items-center gap-2">
                                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" aria-hidden />
                                            <span className="truncate text-[13px] font-medium text-foreground">{h.title}</span>
                                        </span>
                                        <span className="shrink-0 font-mono text-[10.5px] text-muted-foreground">{h.platform}</span>
                                    </summary>
                                    <div className="space-y-2 px-3 pb-3">
                                        <p className="text-[12px] text-muted-foreground">{h.purpose}</p>
                                        <div className="relative">
                                            <pre className="overflow-x-auto rounded-md bg-foreground/[0.04] p-3 pr-12 font-mono text-[11.5px] leading-relaxed text-foreground/90">{h.query}</pre>
                                            <CopyButton value={h.query} iconOnly label={`Copy ${h.title}`} className="absolute right-1.5 top-1.5" />
                                        </div>
                                    </div>
                                </details>
                            ))}
                        </div>
                        <p className="mt-2 text-[11.5px] text-muted-foreground">Queries contain the real (not defanged) values so they run as-is.</p>
                    </section>
                )}
            </div>
        </Panel>
    );
}
