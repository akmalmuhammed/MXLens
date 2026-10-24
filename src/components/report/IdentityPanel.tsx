import { CheckCircle2, CircleAlert, CircleDashed, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Report, Tone } from "@/lib/report/buildReport";
import { Panel } from "./primitives";

const ICON: Record<Tone, typeof CheckCircle2> = { pass: CheckCircle2, fail: XCircle, warn: CircleAlert, neutral: CircleDashed };
const COLOR: Record<Tone, string> = { pass: "text-sev-pass", fail: "text-sev-critical", warn: "text-sev-medium", neutral: "text-muted-foreground" };

export function IdentityPanel({ report }: { report: Report }) {
    const { rows, checks } = report.identity;

    return (
        <Panel id="sender" index="03" title="Sender identity">
            <dl className="divide-y divide-hairline">
                {rows.map(row => (
                    <div key={row.label} className="grid gap-1 py-2.5 first:pt-0 sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
                        <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{row.label}</dt>
                        <dd className="min-w-0 break-all font-mono text-[13px] text-foreground/90">{row.value}</dd>
                        <dd>
                            {row.matchesFrom === false && (
                                <span className="font-mono text-[11px] uppercase tracking-wider text-sev-medium">Different domain</span>
                            )}
                            {row.matchesFrom === true && (
                                <span className="font-mono text-[11px] uppercase tracking-wider text-sev-pass">Same domain</span>
                            )}
                        </dd>
                    </div>
                ))}
            </dl>

            {checks.length > 0 && (
                <ul className="mt-3 grid gap-2 border-t border-hairline pt-3 sm:grid-cols-2">
                    {checks.map(check => {
                        const Icon = ICON[check.tone];
                        return (
                            <li key={check.label} className="flex items-start gap-2 text-sm text-foreground/90">
                                <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", COLOR[check.tone])} />
                                <span className="min-w-0 break-words">{check.label}</span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Panel>
    );
}
