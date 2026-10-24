"use client";

import { Lock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { Report } from "@/lib/report/buildReport";
import { Panel } from "./primitives";

export function ScopePanel({
    report,
    analyzeBody,
    setAnalyzeBody,
    analyzeAttachments,
    setAnalyzeAttachments,
    enrichmentEnabled,
}: {
    report: Report;
    analyzeBody: boolean;
    setAnalyzeBody: (value: boolean) => void;
    analyzeAttachments: boolean;
    setAnalyzeAttachments: (value: boolean) => void;
    enrichmentEnabled: boolean;
}) {
    const rows = [
        { id: "scope-headers", label: "Headers", hint: "Authentication, routing, sender", checked: true, disabled: true, onChange: () => {} },
        { id: "scope-body", label: "Body", hint: "Links, forms, wording, hidden text", checked: analyzeBody, disabled: false, onChange: setAnalyzeBody },
        { id: "scope-attachments", label: "Attachments", hint: "File types, macros, hashes", checked: analyzeAttachments, disabled: false, onChange: setAnalyzeAttachments },
    ];

    return (
        <Panel title="Analysis scope" className="no-print">
            <ul className="space-y-3">
                {rows.map(row => (
                    <li key={row.id} className="flex items-center justify-between gap-3">
                        <label htmlFor={row.id} className="min-w-0">
                            <span className="block text-sm text-foreground">{row.label}</span>
                            <span className="block text-xs text-muted-foreground">{row.hint}</span>
                        </label>
                        <Switch
                            id={row.id}
                            checked={row.checked}
                            disabled={row.disabled}
                            onCheckedChange={row.onChange}
                            aria-label={row.id === "scope-body" ? "Analyze email body content" : row.id === "scope-attachments" ? "Analyze email attachments" : "Headers are always analyzed"}
                        />
                    </li>
                ))}
            </ul>
            <p className="mt-4 flex items-start gap-2 border-t border-hairline pt-3 text-xs leading-relaxed text-muted-foreground">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {enrichmentEnabled
                    ? "Analysis runs in this browser. This server also looks up public IPs, domains and hashes with reputation services."
                    : "Everything runs in this browser. Nothing about this email is uploaded or looked up."}
            </p>
            {report.scope.body !== analyzeBody || report.scope.attachments !== analyzeAttachments ? (
                <p className="mt-2 text-xs text-sev-info">Updating…</p>
            ) : null}
        </Panel>
    );
}
