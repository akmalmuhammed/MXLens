import { useMemo, useState } from "react";
import { ChevronRight, CircleStop, Download, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildReport, type Report, type Verdict } from "@/lib/report/buildReport";
import { RiskMeter, VERDICT_BG, VERDICT_TEXT } from "@/components/report/primitives";
import { BulkAnalysisResult, BulkFile } from "./BulkProcessor";

interface BulkAnalysisDashboardProps {
    files: BulkFile[];
    onClear: () => void;
    onCancel: () => void;
    onSelectFile: (analysis: BulkAnalysisResult) => void;
}

interface Row {
    item: BulkFile;
    report: Report | null;
}

const FILTERS: { id: Verdict | "all"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "malicious", label: "High risk" },
    { id: "suspicious", label: "Suspicious" },
    { id: "clean", label: "Likely legitimate" },
];

function csvCell(value: string | number) {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function BulkAnalysisDashboard({ files, onClear, onCancel, onSelectFile }: BulkAnalysisDashboardProps) {
    const [query, setQuery] = useState("");
    const [verdictFilter, setVerdictFilter] = useState<Verdict | "all">("all");

    // Worst first: analysts triage from the top. Unfinished files sink to the bottom.
    const rows = useMemo<Row[]>(() => {
        return files
            .map(item => ({
                item,
                report: item.result ? buildReport(item.result.header, item.result.signals, item.result.scoring) : null,
            }))
            .sort((a, b) => (b.report?.risk ?? -1) - (a.report?.risk ?? -1));
    }, [files]);

    const count = (verdict: Verdict) => rows.filter(r => r.report?.verdict === verdict).length;
    const resolved = files.filter(f => f.status === "completed" || f.status === "error" || f.status === "cancelled").length;
    const pending = files.length - resolved;
    const failed = files.filter(f => f.status === "error").length;
    const progress = Math.round((resolved / (files.length || 1)) * 100);

    const visible = rows.filter(({ item, report }) => {
        if (verdictFilter !== "all" && report?.verdict !== verdictFilter) return false;
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return [item.file.name, report?.message.subject ?? "", report?.message.from ?? ""].some(v => v.toLowerCase().includes(q));
    });

    const exportCsv = () => {
        const header = ["file", "verdict", "risk", "confidence", "subject", "from", "spf", "dkim", "dmarc", "top_finding", "status", "error"];
        const lines = rows.map(({ item, report }) => {
            const auth = (name: string) => report?.auth.checks.find(c => c.name === name)?.status ?? "";
            return [
                item.file.name,
                report?.verdictLabel ?? "",
                report?.risk ?? "",
                report?.confidence.level ?? "",
                report?.message.subject ?? "",
                report?.message.from ?? "",
                auth("SPF"),
                auth("DKIM"),
                auth("DMARC"),
                report?.findings[0]?.title ?? "",
                item.status,
                item.error ?? "",
            ].map(csvCell).join(",");
        });
        const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `mxlens-bulk-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4">
            <section className="relative overflow-hidden rounded-2xl border border-hairline bg-panel p-5 sm:p-6">
                <div className="report-grid-bg pointer-events-none absolute inset-0 opacity-60" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-sev-info">Bulk triage</p>
                        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                            {files.length} {files.length === 1 ? "message" : "messages"}
                        </h1>
                        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            {pending > 0 && <Loader2 className="h-3.5 w-3.5 animate-spin text-sev-info" />}
                            {pending > 0 ? `Analyzing… ${progress}%` : "Analysis complete"}
                            {failed > 0 && <span className="text-sev-critical">· {failed} failed</span>}
                        </p>
                    </div>
                    <dl className="grid grid-cols-3 gap-2 sm:gap-3">
                        {([
                            ["malicious", "High risk"],
                            ["suspicious", "Suspicious"],
                            ["clean", "Legitimate"],
                        ] as [Verdict, string][]).map(([verdict, label]) => (
                            <div key={verdict} className="min-w-[96px] rounded-xl border border-hairline bg-background/40 px-3 py-2.5">
                                <dt className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                                    <span className={cn("h-1.5 w-1.5 rounded-full", VERDICT_BG[verdict])} /> {label}
                                </dt>
                                <dd className={cn("mt-1 font-mono text-2xl font-semibold tabular-nums", VERDICT_TEXT[verdict])}>{count(verdict)}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
                {pending > 0 && (
                    <div className="relative mt-5 h-1 overflow-hidden rounded-full bg-foreground/10">
                        <div className="h-full rounded-full bg-sev-info transition-all" style={{ width: `${progress}%` }} />
                    </div>
                )}
            </section>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative sm:w-72">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search file, subject or sender"
                            aria-label="Search bulk results"
                            className="h-9 w-full rounded-lg border border-hairline bg-panel pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-sev-info/50"
                        />
                    </div>
                    <div className="flex gap-1 overflow-x-auto rounded-lg border border-hairline bg-panel p-0.5">
                        {FILTERS.map(filter => (
                            <button
                                key={filter.id}
                                type="button"
                                onClick={() => setVerdictFilter(filter.id)}
                                className={cn(
                                    "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                                    verdictFilter === filter.id ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportCsv} disabled={resolved === 0} className="h-9 gap-1.5 border-hairline bg-transparent">
                        <Download className="h-4 w-4" /> Export CSV
                    </Button>
                    {pending > 0 && (
                        <Button variant="outline" size="sm" onClick={onCancel} className="h-9 gap-1.5 border-hairline bg-transparent">
                            <CircleStop className="h-4 w-4" /> Stop
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={onClear} className="h-9 gap-1.5 border-hairline bg-transparent text-muted-foreground hover:text-sev-critical">
                        <X className="h-4 w-4" /> Clear
                    </Button>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-hairline bg-panel">
                <div className="hidden grid-cols-[150px_minmax(0,1fr)_minmax(0,220px)_40px] gap-4 border-b border-hairline px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground md:grid">
                    <span>Risk</span>
                    <span>Message</span>
                    <span>File</span>
                    <span className="sr-only">Open</span>
                </div>
                {visible.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">No messages match.</p>}
                <ul className="divide-y divide-hairline">
                    {visible.map(({ item, report }) => {
                        const content = (
                            <>
                                <div className="flex items-center gap-3">
                                    {report ? (
                                        <>
                                            <span className={cn("w-8 font-mono text-lg font-semibold tabular-nums", VERDICT_TEXT[report.verdict])}>{report.risk}</span>
                                            <div className="w-20">
                                                <RiskMeter value={report.risk} verdict={report.verdict} segments={10} />
                                                <p className={cn("mt-1 font-mono text-[10px] uppercase tracking-wider", VERDICT_TEXT[report.verdict])}>{report.verdictLabel}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                                            {item.status === "processing" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                            {item.status === "error" ? <span className="text-sev-critical">Failed</span> : item.status}
                                        </span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-foreground">{report?.message.subject ?? (item.error || "—")}</p>
                                    <p className="truncate font-mono text-[12px] text-muted-foreground">{report?.message.from ?? ""}</p>
                                    {report?.findings[0] && <p className="mt-0.5 truncate text-xs text-muted-foreground">{report.findings[0].title}</p>}
                                </div>
                                <span className="hidden truncate font-mono text-[12px] text-muted-foreground md:block">{item.file.name}</span>
                                {report && <ChevronRight className="hidden h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground md:block" />}
                            </>
                        );
                        const layout = "group grid w-full grid-cols-[110px_minmax(0,1fr)] items-center gap-4 px-4 py-3 text-left md:grid-cols-[150px_minmax(0,1fr)_minmax(0,220px)_40px]";
                        return (
                            <li key={item.id}>
                                {item.result ? (
                                    <button
                                        type="button"
                                        onClick={() => onSelectFile(item.result!)}
                                        aria-label={`Open report for ${item.file.name}`}
                                        className={cn(layout, "transition-colors hover:bg-foreground/[0.03] focus-visible:bg-foreground/[0.05] focus-visible:outline-none")}
                                    >
                                        {content}
                                    </button>
                                ) : (
                                    <div className={layout}>{content}</div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
