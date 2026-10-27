import { cn } from "@/lib/utils";
import type { Report } from "@/lib/report/buildReport";
import type { InvestigationHop } from "@/lib/investigation/Investigation";
import { EmptyLine, Panel, Pill } from "./primitives";

function formatTime(iso: string | null) {
    if (!iso) return "";
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const ROLE_STYLE: Record<InvestigationHop["role"], string> = {
    origin: "border-sev-critical/30 text-sev-critical",
    "sender-relay": "border-sev-medium/30 text-sev-medium",
    entry: "border-sev-info/30 text-sev-info",
    gateway: "border-hairline text-muted-foreground",
    "recipient-system": "border-sev-pass/30 text-sev-pass",
};

export function DeliveryPathPanel({ report }: { report: Report }) {
    const { hops, summary } = report.investigation.path;

    return (
        <Panel
            id="path"
            index="06"
            title="Delivery path"
            aside={hops.length > 0 && <span className="font-mono text-[11px] text-muted-foreground">{hops.length} {hops.length === 1 ? "hop" : "hops"}, oldest first</span>}
        >
            {hops.length === 0 ? (
                <EmptyLine>No Received headers, so the delivery path cannot be traced.</EmptyLine>
            ) : (
                <>
                    <p className="mb-3 text-[13px] leading-relaxed text-muted-foreground">{summary}</p>
                    <ol className="relative space-y-3 pl-6">
                        <span className="absolute bottom-3 left-[7px] top-3 w-px bg-gradient-to-b from-sev-critical/50 via-hairline to-sev-pass/60" aria-hidden />
                        {hops.map(hop => {
                            const slow = hop.notes.some(n => n.startsWith("held"));
                            return (
                                <li key={hop.index} className="relative">
                                    <span
                                        className={cn(
                                            "absolute -left-6 top-3 h-3.5 w-3.5 rounded-full border-2 bg-panel",
                                            hop.role === "origin" ? "border-sev-critical" : hop.role === "entry" ? "border-sev-info" : hop.role === "recipient-system" ? "border-sev-pass" : "border-foreground/30"
                                        )}
                                        aria-hidden
                                    />
                                    <div className="rounded-lg border border-hairline px-3 py-2.5">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="min-w-0 font-mono text-[12.5px]">
                                                <span className="text-muted-foreground">{hop.from || "unknown"}</span>
                                                <span className="mx-1.5 text-muted-foreground/50">→</span>
                                                <span className="break-all text-foreground">{hop.by || "unknown"}</span>
                                            </div>
                                            <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                                                {formatTime(hop.time)}
                                                {hop.delay && <span className={cn(slow ? "text-sev-medium" : "text-muted-foreground")}>+{hop.delay}</span>}
                                            </div>
                                        </div>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                            <Pill className={cn("normal-case tracking-normal", ROLE_STYLE[hop.role])}>{hop.roleLabel}</Pill>
                                            {hop.operator && <Pill className="border-hairline normal-case tracking-normal text-muted-foreground">{hop.operator}</Pill>}
                                            {hop.ip && <span className="font-mono text-[11px] text-muted-foreground">{hop.ip}</span>}
                                            {hop.notes.map(note => (
                                                <Pill key={note} className={cn("normal-case tracking-normal", /held|called itself|authenticated as|local/.test(note) ? "border-sev-medium/30 text-sev-medium" : "border-hairline text-muted-foreground")}>{note}</Pill>
                                            ))}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </>
            )}
        </Panel>
    );
}
