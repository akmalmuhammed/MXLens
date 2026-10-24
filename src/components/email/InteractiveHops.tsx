import { EmailHop } from "@/lib/email/HeaderParser";
import { ArrowDown, Globe, ShieldAlert, ChevronDown, ChevronUp, Server, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

interface InteractiveHopsProps {
    hops: EmailHop[];
}

export function InteractiveHops({ hops }: InteractiveHopsProps) {
    const [openHops, setOpenHops] = useState<number[]>([]);

    if (hops.length === 0) return (
        <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            No routing information (Receive headers) found.
        </div>
    );

    const toggleHop = (index: number) => {
        setOpenHops(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    // Helper to format delay
    const formatDelay = (seconds: number) => {
        if (seconds < 1) return "< 1s";
        if (seconds < 60) return `${seconds.toFixed(1)}s`;
        if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
        return `${(seconds / 3600).toFixed(1)}h`;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg font-heading flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Delivery Path Investigation
                </h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {hops.length} Hops
                </span>
            </div>

            <div className="relative border-l-2 border-primary/20 ml-3 space-y-6 pb-2 pt-2">
                {hops.map((hop, index) => {
                    const isLongDelay = hop.delay > 600; // 10 mins
                    const isInternal = hop.annotations?.includes("Internal IP");
                    const isOpen = openHops.includes(index);
                    const isLast = index === hops.length - 1;

                    return (
                        <div key={index} className="relative pl-8">
                            {/* Timeline Node */}
                            <div
                                onClick={() => toggleHop(index)}
                                className={cn(
                                    "absolute -left-[11px] top-1 h-6 w-6 rounded-full border-4 bg-background flex items-center justify-center cursor-pointer transition-colors z-10",
                                    isLongDelay ? "border-amber-400" : isLast ? "border-emerald-500" : "border-primary/30 hover:border-primary"
                                )}>
                                <div className={cn("h-2 w-2 rounded-full", isLongDelay ? "bg-amber-500" : isLast ? "bg-emerald-500" : "bg-primary")} />
                            </div>

                            {/* Card Container */}
                            <div className={cn(
                                "rounded-lg border transition-all duration-200 overflow-hidden",
                                isOpen ? "shadow-md bg-card ring-1 ring-primary/20" : "bg-card/50 hover:bg-card hover:shadow-sm"
                            )}>
                                {/* Header / Trigger */}
                                <div
                                    className="p-3 cursor-pointer flex items-center justify-between select-none"
                                    onClick={() => toggleHop(index)}
                                >
                                    <div className="flex flex-col gap-0.5 max-w-[80%]">
                                        <div className="flex items-center gap-2 text-sm font-bold text-foreground overflow-hidden">
                                            <span className="truncate" title={hop.from}>{hop.from}</span>
                                            <ArrowDown className="w-3 h-3 text-muted-foreground shrink-0" />
                                            <span className="truncate text-primary" title={hop.by}>{hop.by}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="font-mono">{format(new Date(hop.timestamp), "HH:mm:ss")}</span>
                                            {hop.ip && <span className="flex items-center gap-1"><Server className="w-3 h-3" /> {hop.ip}</span>}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {hop.delay > 1 && (
                                            <div className={cn("text-xs px-2 py-0.5 rounded font-mono font-medium", isLongDelay ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-muted text-muted-foreground")}>
                                                +{formatDelay(hop.delay)}
                                            </div>
                                        )}
                                        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                <Collapsible open={isOpen}>
                                    <CollapsibleContent>
                                        <div className="p-3 pt-0 border-t bg-muted/20 text-xs">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3">
                                                <div className="space-y-2">
                                                    <h4 className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Technical Details</h4>
                                                    <div className="grid grid-cols-[80px_1fr] gap-1">
                                                        <span className="text-muted-foreground">Received:</span>
                                                        <span className="font-mono text-foreground">{format(new Date(hop.timestamp), "PPP pp")}</span>

                                                        <span className="text-muted-foreground">Protocol:</span>
                                                        <span className="font-mono text-foreground">{hop.with || 'SMTP'}</span>

                                                        <span className="text-muted-foreground">IP Addr:</span>
                                                        <span className="font-mono text-foreground flex items-center gap-1">
                                                            {hop.ip || 'N/A'}
                                                            {isInternal && <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[9px] px-1 rounded ml-1">INTERNAL</span>}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <h4 className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Annotations</h4>
                                                    {hop.annotations && hop.annotations.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {hop.annotations.map((note, i) => (
                                                                <span key={i} className="px-2 py-1 bg-background border rounded text-muted-foreground">{note}</span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-muted-foreground italic">No specific anomalies detected.</p>
                                                    )}

                                                    {isLongDelay && (
                                                        <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded text-amber-800 dark:text-amber-300">
                                                            <div className="font-bold flex items-center gap-1 mb-1"><ShieldAlert className="w-3 h-3" /> Analysis: Long Delay</div>
                                                            <p className="opacity-90">A delay of {formatDelay(hop.delay)} occurred here. This often indicates Greylisting (anti-spam check) or heavy server load, but can also hide malicious relaying.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="pl-6 pt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Final Destination (This System)</span>
                    <div className="w-2 h-2 rounded-full bg-amber-500 ml-4" />
                    <span>Slow Relay ({">"}10m)</span>
                </div>
            </div>
        </div>
    );
}
