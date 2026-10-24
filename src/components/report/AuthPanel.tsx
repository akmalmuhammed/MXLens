import { CheckCircle2, CircleDashed, CircleAlert, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Report, Tone } from "@/lib/report/buildReport";
import { Panel } from "./primitives";

const TONE_ICON: Record<Tone, typeof CheckCircle2> = {
    pass: CheckCircle2,
    fail: XCircle,
    warn: CircleAlert,
    neutral: CircleDashed,
};

const TONE_CARD: Record<Tone, string> = {
    pass: "border-sev-pass/25",
    fail: "border-sev-critical/35 bg-sev-critical/[0.04]",
    warn: "border-sev-medium/30 bg-sev-medium/[0.03]",
    neutral: "border-hairline",
};

const TONE_TEXT: Record<Tone, string> = {
    pass: "text-sev-pass",
    fail: "text-sev-critical",
    warn: "text-sev-medium",
    neutral: "text-muted-foreground",
};

export function AuthPanel({ report }: { report: Report }) {
    const { auth } = report;

    return (
        <Panel id="authentication" index="02" title="Authentication">
            {!auth.resultsPresent && (
                <p className="mb-3 rounded-lg border border-sev-medium/30 bg-sev-medium/10 px-3 py-2 text-xs text-sev-medium">
                    No Authentication-Results header. The receiving server did not record SPF, DKIM or DMARC checks, so these
                    cannot be confirmed.
                </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {auth.checks.map(check => {
                    const Icon = TONE_ICON[check.tone];
                    return (
                        <div key={check.name} className={cn("flex flex-col rounded-lg border p-3", TONE_CARD[check.tone])}>
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-[11px] font-semibold tracking-wider text-muted-foreground">{check.name}</span>
                                <Icon className={cn("h-4 w-4", TONE_TEXT[check.tone])} />
                            </div>
                            <div className={cn("mt-1.5 font-mono text-lg font-semibold uppercase leading-none", TONE_TEXT[check.tone])}>{check.status}</div>
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{check.explanation}</p>
                            {check.detail && (
                                <code className="mt-2 block break-all rounded bg-foreground/[0.04] px-1.5 py-1 font-mono text-[10.5px] leading-relaxed text-muted-foreground">
                                    {check.detail}
                                </code>
                            )}
                        </div>
                    );
                })}
            </div>

            {auth.authservId && (
                <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                    Checked by <span className="text-foreground/80">{auth.authservId}</span>
                    {auth.authservKnown ? " (known provider)" : " (not a known provider; results reflect that server's checks)"}
                </p>
            )}
        </Panel>
    );
}
