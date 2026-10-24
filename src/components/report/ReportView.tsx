"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisResult } from "@/lib/email/HeaderParser";
import type { NormalizedSignals, ScoringResult } from "@/lib/email/scoring/types";
import { buildReport, reportToText } from "@/lib/report/buildReport";
import { ActionsPanel } from "./ActionsPanel";
import { AttachmentsPanel } from "./AttachmentsPanel";
import { AuthPanel } from "./AuthPanel";
import { ContentPanel } from "./ContentPanel";
import { DeliveryPathPanel } from "./DeliveryPathPanel";
import { EnrichmentPanel } from "./EnrichmentPanel";
import { FindingsPanel } from "./FindingsPanel";
import { HeaderNotesPanel } from "./HeaderNotesPanel";
import { IdentityPanel } from "./IdentityPanel";
import { IndicatorsPanel } from "./IndicatorsPanel";
import { LinksPanel } from "./LinksPanel";
import { ScopePanel } from "./ScopePanel";
import { VerdictHeader } from "./VerdictHeader";
import { VERDICT_BG, VERDICT_TEXT } from "./primitives";

export interface AnalysisSnapshot {
    header: AnalysisResult;
    signals: NormalizedSignals;
    scoring: ScoringResult;
    emailContent: { text: string; html: string };
    timestamp: number;
}

interface ReportViewProps {
    analysis: AnalysisSnapshot;
    onClear: () => void;
    /** Shown when the report was opened from a bulk batch. */
    onBack?: () => void;
    backLabel?: string;
    analyzeBody: boolean;
    setAnalyzeBody: (value: boolean) => void;
    analyzeAttachments: boolean;
    setAnalyzeAttachments: (value: boolean) => void;
    enrichmentEnabled?: boolean;
}

const SECTIONS = [
    { id: "findings", label: "Findings" },
    { id: "authentication", label: "Auth" },
    { id: "sender", label: "Sender" },
    { id: "links", label: "Links" },
    { id: "attachments", label: "Attachments" },
    { id: "path", label: "Path" },
    { id: "content", label: "Message" },
];

export function ReportView({
    analysis,
    onClear,
    onBack,
    backLabel = "Back",
    analyzeBody,
    setAnalyzeBody,
    analyzeAttachments,
    setAnalyzeAttachments,
    enrichmentEnabled = false,
}: ReportViewProps) {
    const report = useMemo(() => buildReport(analysis.header, analysis.signals, analysis.scoring), [analysis]);
    const [defanged, setDefanged] = useState(true);
    const summaryText = useMemo(() => reportToText(report, { defang: defanged }), [report, defanged]);
    const headerBlock = useMemo(() => analysis.header.rawHeaders.split(/\r?\n\r?\n/)[0] ?? "", [analysis.header.rawHeaders]);
    const activeSection = useActiveSection(SECTIONS.map(s => s.id));

    const exportJson = () => {
        const blob = new Blob(
            [JSON.stringify({ generatedBy: "MXLens", report, engine: { header: { ...analysis.header, rawHeaders: undefined }, signals: analysis.signals, scoring: analysis.scoring } }, null, 2)],
            { type: "application/json" }
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `mxlens-report-${new Date(analysis.timestamp).toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const actions = (className: string) => <ActionsPanel report={report} className={className} />;

    return (
        <div className="space-y-4 pb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {onBack && (
                <button type="button" onClick={onBack} className="no-print inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> {backLabel}
                </button>
            )}
            <VerdictHeader report={report} summaryText={summaryText} onExportJson={exportJson} onNewAnalysis={onClear} />

            <nav
                aria-label="Report sections"
                className="no-print sticky top-16 z-30 -mx-4 flex items-center gap-3 border-y border-hairline bg-background/85 px-4 py-2 backdrop-blur-md sm:mx-0 sm:rounded-xl sm:border"
            >
                <span className={cn("hidden shrink-0 items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider sm:inline-flex", VERDICT_TEXT[report.verdict])}>
                    <span className={cn("h-2 w-2 rounded-full", VERDICT_BG[report.verdict])} />
                    {report.verdictLabel} · {report.risk}
                </span>
                <span className="hidden h-4 w-px bg-hairline sm:block" aria-hidden />
                <div className="-my-1 flex min-w-0 gap-1 overflow-x-auto py-1 [scrollbar-width:none]">
                    {SECTIONS.map(section => (
                        <a
                            key={section.id}
                            href={`#${section.id}`}
                            className={cn(
                                "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                                activeSection === section.id ? "bg-sev-info/15 text-sev-info" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {section.label}
                        </a>
                    ))}
                </div>
            </nav>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0 space-y-4">
                    {actions("lg:hidden")}
                    <FindingsPanel report={report} />
                    <AuthPanel report={report} />
                    <IdentityPanel report={report} />
                    <LinksPanel report={report} defanged={defanged} />
                    <AttachmentsPanel report={report} />
                    <DeliveryPathPanel report={report} />
                    <ContentPanel html={analysis.emailContent.html} text={analysis.emailContent.text} rawHeaders={headerBlock} />
                    {enrichmentEnabled && <EnrichmentPanel report={report} fromDomain={analysis.signals.fromDomain} />}
                </div>

                <aside className="min-w-0 space-y-4">
                    {actions("hidden lg:block")}
                    <IndicatorsPanel report={report} defanged={defanged} onDefangedChange={setDefanged} />
                    <HeaderNotesPanel report={report} />
                    <ScopePanel
                        report={report}
                        analyzeBody={analyzeBody}
                        setAnalyzeBody={setAnalyzeBody}
                        analyzeAttachments={analyzeAttachments}
                        setAnalyzeAttachments={setAnalyzeAttachments}
                        enrichmentEnabled={enrichmentEnabled}
                    />
                </aside>
            </div>
        </div>
    );
}

/** Tracks which report section is nearest the top of the viewport. */
function useActiveSection(ids: string[]) {
    const [active, setActive] = useState(ids[0]);
    const key = ids.join(",");

    useEffect(() => {
        const elements = key.split(",").map(id => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));
        if (elements.length === 0) return;
        const observer = new IntersectionObserver(
            entries => {
                const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActive(visible[0].target.id);
            },
            { rootMargin: "-140px 0px -55% 0px" }
        );
        elements.forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, [key]);

    return active;
}
