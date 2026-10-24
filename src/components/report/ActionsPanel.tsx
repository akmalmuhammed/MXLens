"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Report } from "@/lib/report/buildReport";
import { Panel } from "./primitives";

export function ActionsPanel({ report, className }: { report: Report; className?: string }) {
    const [done, setDone] = useState<Set<number>>(new Set());

    const toggle = (index: number) =>
        setDone(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });

    return (
        <Panel title="What to do" className={className} aside={<span className="font-mono text-[11px] text-muted-foreground">{done.size}/{report.actions.length}</span>}>
            <ul className="space-y-1">
                {report.actions.map((action, index) => {
                    const checked = done.has(index);
                    return (
                        <li key={action}>
                            <button
                                type="button"
                                role="checkbox"
                                aria-checked={checked}
                                onClick={() => toggle(index)}
                                className="-mx-2 flex w-[calc(100%+1rem)] items-start gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sev-info/50"
                            >
                                <span
                                    className={cn(
                                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                                        checked ? "border-sev-pass bg-sev-pass text-background" : "border-foreground/25"
                                    )}
                                >
                                    {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                                </span>
                                <span className={cn("leading-snug", checked ? "text-muted-foreground line-through" : "text-foreground/90")}>{action}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </Panel>
    );
}
