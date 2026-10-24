import { cn } from "@/lib/utils";
import type { Report } from "@/lib/report/buildReport";
import { EmptyLine, Panel, Pill } from "./primitives";

function formatDelay(seconds: number) {
    if (seconds < 60) return `+${seconds}s`;
    if (seconds < 3600) return `+${Math.round(seconds / 60)}m`;
    return `+${(seconds / 3600).toFixed(1)}h`;
}

function formatTime(iso: string) {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function DeliveryPathPanel({ report }: { report: Report }) {
    const { hops } = report;

    return (
        <Panel
            id="path"
            index="06"
            title="Delivery path"
            aside={hops.length > 0 && <span className="font-mono text-[11px] text-muted-foreground">{hops.length} {hops.length === 1 ? "hop" : "hops"}</span>}
        >
            {hops.length === 0 ? (
                <EmptyLine>No Received headers, so the delivery path cannot be traced.</EmptyLine>
            ) : (
                <ol className="relative space-y-3 pl-6">
                    <span className="absolute bottom-3 left-[7px] top-3 w-px bg-gradient-to-b from-sev-info/60 via-hairline to-sev-pass/60" aria-hidden />
                    {hops.map((hop, index) => {
                        const isFirst = index === 0;
                        const isLast = index === hops.length - 1;
                        const slow = hop.delaySeconds > 600;
                        return (
                            <li key={`${hop.by}-${index}`} className="relative">
                                <span
                                    className={cn(
                                        "absolute -left-6 top-3 h-3.5 w-3.5 rounded-full border-2 bg-panel",
                                        isLast ? "border-sev-pass" : isFirst ? "border-sev-info" : "border-foreground/30"
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
                                            {index > 0 && (
                                                <span className={cn(slow ? "text-sev-medium" : "text-muted-foreground")}>{formatDelay(hop.delaySeconds)}</span>
                                            )}
                                        </div>
                                    </div>
                                    {(hop.ip || hop.notes.length > 0 || isFirst || isLast) && (
                                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                            {isFirst && <Pill className="border-sev-info/30 text-sev-info">Origin</Pill>}
                                            {isLast && <Pill className="border-sev-pass/30 text-sev-pass">Delivered</Pill>}
                                            {hop.ip && <span className="font-mono text-[11px] text-muted-foreground">{hop.ip}</span>}
                                            {hop.notes.map(note => (
                                                <Pill key={note} className="border-hairline normal-case tracking-normal text-muted-foreground">{note}</Pill>
                                            ))}
                                            {slow && <Pill className="border-sev-medium/30 text-sev-medium normal-case tracking-normal">Slow relay</Pill>}
                                        </div>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            )}
        </Panel>
    );
}
