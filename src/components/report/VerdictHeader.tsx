"use client";

import { ArrowRight, Download, FileText, Printer, RotateCcw, ShieldAlert, ShieldCheck, ShieldQuestion, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Report } from "@/lib/report/buildReport";
import { CopyButton, Eyebrow, RiskMeter, VERDICT_TEXT } from "./primitives";

const VERDICT_ICON = {
    malicious: ShieldAlert,
    suspicious: ShieldAlert,
    clean: ShieldCheck,
    unknown: ShieldQuestion,
};

const VERDICT_GLOW = {
    malicious: "from-sev-critical/15",
    suspicious: "from-sev-medium/12",
    clean: "from-sev-pass/12",
    unknown: "from-sev-low/10",
};

function formatDate(value: string) {
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function VerdictHeader({
    report,
    summaryText,
    onExportJson,
    onNewAnalysis,
}: {
    report: Report;
    summaryText: string;
    onExportJson: () => void;
    onNewAnalysis: () => void;
}) {
    const Icon = VERDICT_ICON[report.verdict];
    const { message } = report;

    return (
        <section className="report-panel relative overflow-hidden rounded-2xl border border-hairline bg-panel">
            <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent to-60%", VERDICT_GLOW[report.verdict])} />
            <div className="report-grid-bg pointer-events-none absolute inset-0 opacity-60" />

            <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
                <div className="min-w-0 space-y-4">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <span className={cn("inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em]", VERDICT_TEXT[report.verdict])}>
                            <Icon className="h-5 w-5" />
                            {report.verdictLabel}
                        </span>
                        <span className="hidden text-muted-foreground/50 sm:inline">/</span>
                        <span className="text-sm text-muted-foreground">{report.headline.replace(/\s*\(Low data confidence\)\s*$/, "")}</span>
                    </div>

                    <h1 className="text-balance break-words text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
                        {message.subject}
                    </h1>

                    <dl className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[12.5px] text-muted-foreground">
                        <dt className="sr-only">From</dt>
                        <dd className="min-w-0 break-all text-foreground/90">{message.from || "Unknown sender"}</dd>
                        {message.to && (
                            <>
                                <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                <dt className="sr-only">To</dt>
                                <dd className="min-w-0 break-all">{message.to}</dd>
                            </>
                        )}
                        {message.date && (
                            <>
                                <span className="text-muted-foreground/40" aria-hidden>·</span>
                                <dt className="sr-only">Date</dt>
                                <dd title={message.date}>{formatDate(message.date)}</dd>
                            </>
                        )}
                    </dl>

                    <div className="no-print flex flex-wrap items-center gap-2 pt-1">
                        <CopyButton value={summaryText} label="Copy summary" className="h-8 px-2.5" />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 gap-1.5 border-hairline bg-transparent text-xs text-muted-foreground hover:text-foreground">
                                    <Download className="h-3.5 w-3.5" /> Export <ChevronDown className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={onExportJson} className="gap-2">
                                    <FileText className="h-4 w-4" /> JSON report
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.print()} className="gap-2">
                                    <Printer className="h-4 w-4" /> Print or save as PDF
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button size="sm" onClick={onNewAnalysis} className="h-8 gap-1.5 bg-sev-info text-xs font-semibold text-background hover:bg-sev-info/90">
                            <RotateCcw className="h-3.5 w-3.5" /> New analysis
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col justify-center gap-4 rounded-xl border border-hairline bg-background/40 p-4 backdrop-blur-sm">
                    <div className="flex items-end justify-between">
                        <div>
                            <Eyebrow>Risk score</Eyebrow>
                            <div className="mt-1 flex items-baseline gap-1">
                                <span className={cn("font-mono text-5xl font-semibold tabular-nums leading-none", VERDICT_TEXT[report.verdict])}>{report.risk}</span>
                                <span className="font-mono text-sm text-muted-foreground">/100</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <Eyebrow>Confidence</Eyebrow>
                            <div className="mt-1 text-sm font-medium text-foreground" title={report.confidence.factors.join(", ")}>
                                {report.confidence.level}
                            </div>
                        </div>
                    </div>
                    <RiskMeter value={report.risk} verdict={report.verdict} />
                    <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                        <span>Safe</span>
                        <span>Suspicious</span>
                        <span>High risk</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
