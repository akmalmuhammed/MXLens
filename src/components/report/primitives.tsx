"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Severity, Tone, Verdict } from "@/lib/report/buildReport";

/** Text colour, tinted background and border for each severity or tone. */
export const SEVERITY_STYLES: Record<Severity, string> = {
    critical: "text-sev-critical bg-sev-critical/10 border-sev-critical/30",
    high: "text-sev-high bg-sev-high/10 border-sev-high/30",
    medium: "text-sev-medium bg-sev-medium/10 border-sev-medium/30",
    low: "text-sev-low bg-sev-low/10 border-sev-low/25",
};

export const TONE_STYLES: Record<Tone, string> = {
    pass: "text-sev-pass bg-sev-pass/10 border-sev-pass/30",
    fail: "text-sev-critical bg-sev-critical/10 border-sev-critical/30",
    warn: "text-sev-medium bg-sev-medium/10 border-sev-medium/30",
    neutral: "text-muted-foreground bg-muted/40 border-hairline",
};

export const VERDICT_TEXT: Record<Verdict, string> = {
    malicious: "text-sev-critical",
    suspicious: "text-sev-medium",
    clean: "text-sev-pass",
    unknown: "text-sev-low",
};

export const VERDICT_BG: Record<Verdict, string> = {
    malicious: "bg-sev-critical",
    suspicious: "bg-sev-medium",
    clean: "bg-sev-pass",
    unknown: "bg-sev-low",
};

export function Panel({
    id,
    index,
    title,
    aside,
    children,
    className,
}: {
    id?: string;
    index?: string;
    title: string;
    aside?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section id={id} className={cn("report-panel scroll-mt-32 rounded-xl border border-hairline bg-panel", className)}>
            <header className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3 sm:px-5">
                <h2 className="flex items-baseline gap-2.5 text-sm font-semibold tracking-tight text-foreground">
                    {index && <span className="font-mono text-[11px] font-medium text-sev-info">{index}</span>}
                    {title}
                </h2>
                {aside && <div className="flex shrink-0 items-center gap-2">{aside}</div>}
            </header>
            <div className="px-4 py-4 sm:px-5">{children}</div>
        </section>
    );
}

export function Pill({ className, children }: { className?: string; children: ReactNode }) {
    return (
        <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 font-mono text-[10.5px] font-medium uppercase tracking-wide", className)}>
            {children}
        </span>
    );
}

export function SeverityPill({ severity }: { severity: Severity }) {
    return <Pill className={SEVERITY_STYLES[severity]}>{severity}</Pill>;
}

export function TonePill({ tone, children }: { tone: Tone; children: ReactNode }) {
    return <Pill className={TONE_STYLES[tone]}>{children}</Pill>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn("font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground", className)}>{children}</div>;
}

/** Segmented 0-100 meter. Segments light up to `value` in the verdict colour. */
export function RiskMeter({ value, verdict, segments = 20 }: { value: number; verdict: Verdict; segments?: number }) {
    const lit = Math.round((value / 100) * segments);
    return (
        <div className="flex h-2.5 gap-[3px]" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label="Risk score">
            {Array.from({ length: segments }, (_, i) => (
                <span
                    key={i}
                    className={cn(
                        "flex-1 rounded-[2px] transition-colors",
                        i < lit ? VERDICT_BG[verdict] : "bg-foreground/10",
                        i === lit - 1 && cn(VERDICT_TEXT[verdict], "shadow-[0_0_10px_currentColor]")
                    )}
                />
            ))}
        </div>
    );
}

export function CopyButton({ value, label = "Copy", className, iconOnly }: { value: string; label?: string; className?: string; iconOnly?: boolean }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            toast.success(iconOnly ? "Copied" : `${label} copied`);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            toast.error("Clipboard is not available in this browser");
        }
    };

    return (
        <button
            type="button"
            onClick={copy}
            title={label}
            aria-label={label}
            className={cn(
                "no-print inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-sev-info/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sev-info/50",
                iconOnly && "border-transparent px-1.5",
                className
            )}
        >
            {copied ? <Check className="h-3.5 w-3.5 text-sev-pass" /> : <Copy className="h-3.5 w-3.5" />}
            {!iconOnly && <span>{label}</span>}
        </button>
    );
}

export function EmptyLine({ children }: { children: ReactNode }) {
    return <p className="text-sm text-muted-foreground">{children}</p>;
}
