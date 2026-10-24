"use client";

import { useState } from "react";
import { ChevronDown, ShieldCheck, ShieldPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FindingCategory, Report, Severity } from "@/lib/report/buildReport";
import { EmptyLine, Panel, SeverityPill } from "./primitives";

const CATEGORY_LABEL: Record<FindingCategory, string> = {
    authentication: "Authentication",
    sender: "Sender",
    content: "Content",
    links: "Links",
    attachments: "Attachments",
    routing: "Routing",
};

const BAR: Record<Severity, string> = {
    critical: "bg-sev-critical",
    high: "bg-sev-high",
    medium: "bg-sev-medium",
    low: "bg-sev-low",
};

const VISIBLE = 6;

export function FindingsPanel({ report }: { report: Report }) {
    const [showAll, setShowAll] = useState(false);
    const { findings, mitigations } = report;
    const visible = showAll ? findings : findings.slice(0, VISIBLE);
    const maxImpact = Math.max(50, ...findings.map(f => f.impact));

    const counts = (["critical", "high", "medium", "low"] as Severity[])
        .map(severity => ({ severity, count: findings.filter(f => f.severity === severity).length }))
        .filter(c => c.count > 0);

    return (
        <Panel
            id="findings"
            index="01"
            title="Why this verdict"
            aside={
                counts.length > 0 && (
                    <div className="hidden items-center gap-3 font-mono text-[11px] text-muted-foreground sm:flex">
                        {counts.map(c => (
                            <span key={c.severity} className="inline-flex items-center gap-1.5">
                                <span className={cn("h-1.5 w-1.5 rounded-full", BAR[c.severity])} />
                                {c.count} {c.severity}
                            </span>
                        ))}
                    </div>
                )
            }
        >
            {findings.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-sev-pass">
                    <ShieldCheck className="h-4 w-4" /> No risk indicators were found.
                </div>
            ) : (
                <ol className="-mx-2 space-y-0.5">
                    {visible.map(finding => (
                        <li key={finding.id} className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-2 hover:bg-foreground/[0.03]">
                            <span className={cn("h-8 w-1 rounded-full", BAR[finding.severity])} aria-hidden />
                            <div className="min-w-0">
                                <p className="break-words text-sm leading-snug text-foreground">{finding.title}</p>
                                <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{CATEGORY_LABEL[finding.category]}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="hidden w-20 sm:block" title={`Adds ${finding.impact} risk points`}>
                                    <div className="h-1 rounded-full bg-foreground/10">
                                        <div className={cn("h-1 rounded-full", BAR[finding.severity])} style={{ width: `${Math.min(100, (finding.impact / maxImpact) * 100)}%` }} />
                                    </div>
                                </div>
                                <span className="w-9 text-right font-mono text-xs tabular-nums text-muted-foreground">+{finding.impact}</span>
                                <span className="flex w-[74px] justify-end">
                                    <SeverityPill severity={finding.severity} />
                                </span>
                            </div>
                        </li>
                    ))}
                </ol>
            )}

            {findings.length > VISIBLE && (
                <button
                    type="button"
                    onClick={() => setShowAll(v => !v)}
                    className="no-print mt-2 inline-flex items-center gap-1 text-xs font-medium text-sev-info hover:underline"
                >
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showAll && "rotate-180")} />
                    {showAll ? "Show fewer" : `Show all ${findings.length} findings`}
                </button>
            )}

            {mitigations.length > 0 && (
                <div className="mt-4 border-t border-hairline pt-3">
                    <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Lowered the risk</p>
                    <ul className="space-y-1.5">
                        {mitigations.map(m => (
                            <li key={m.id} className="flex items-start gap-2 text-sm text-foreground/90">
                                <ShieldPlus className="mt-0.5 h-4 w-4 shrink-0 text-sev-pass" />
                                <span className="min-w-0 flex-1 break-words">{m.title}</span>
                                <span className="font-mono text-xs tabular-nums text-sev-pass">−{m.impact}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {!report.scope.body && (
                <EmptyLine>
                    <span className="mt-3 block border-t border-hairline pt-3 text-xs">
                        Body analysis is off, so links, forms and wording were not checked.
                    </span>
                </EmptyLine>
            )}
        </Panel>
    );
}
