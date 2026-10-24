import { FileWarning, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Report } from "@/lib/report/buildReport";
import { CopyButton, EmptyLine, Panel, Pill } from "./primitives";

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AttachmentsPanel({ report }: { report: Report }) {
    const { attachments } = report;

    return (
        <Panel
            id="attachments"
            index="05"
            title="Attachments"
            aside={attachments.length > 0 && <span className="font-mono text-[11px] text-muted-foreground">{attachments.length}</span>}
        >
            {!report.scope.attachments ? (
                <EmptyLine>Turn on attachment analysis to inspect file types, macros and hashes.</EmptyLine>
            ) : attachments.length === 0 ? (
                <EmptyLine>No attachments.</EmptyLine>
            ) : (
                <ul className="space-y-2">
                    {attachments.map(file => {
                        const Icon = file.risky ? FileWarning : Paperclip;
                        return (
                            <li key={`${file.filename}-${file.sha256}`} className={cn("rounded-lg border p-3", file.risky ? "border-sev-critical/30 bg-sev-critical/[0.04]" : "border-hairline")}>
                                <div className="flex items-start gap-3">
                                    <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", file.risky ? "text-sev-critical" : "text-muted-foreground")} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-baseline gap-x-2">
                                            <span className="break-all text-sm font-medium text-foreground">{file.filename}</span>
                                            <span className="font-mono text-[11px] text-muted-foreground">{formatBytes(file.size)}</span>
                                        </div>
                                        {file.flags.length > 0 && (
                                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                {file.flags.map(flag => (
                                                    <Pill key={flag} className={cn("normal-case tracking-normal", file.risky && flag !== "Archive" ? "border-sev-critical/30 bg-sev-critical/10 text-sev-critical" : "border-hairline text-muted-foreground")}>
                                                        {flag}
                                                    </Pill>
                                                ))}
                                            </div>
                                        )}
                                        {file.sha256 && (
                                            <div className="mt-2 flex items-center gap-1">
                                                <code className="min-w-0 truncate font-mono text-[11px] text-muted-foreground">sha256 {file.sha256}</code>
                                                <CopyButton value={file.sha256} label="Copy SHA-256" iconOnly />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Panel>
    );
}
