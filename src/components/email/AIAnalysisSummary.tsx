import { ScoringResult } from "@/lib/email/scoring/types";
import { AnalysisResult } from "@/lib/email/HeaderParser";
import { Sparkles, ShieldCheck, ShieldAlert, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AIAnalysisSummaryProps {
    analysis: AnalysisResult;
    scoring: ScoringResult; // Added this
}

export function AIAnalysisSummary({ analysis, scoring }: AIAnalysisSummaryProps) {
    const { auth, impersonationAlert } = analysis;
    const { verdict } = scoring;
    const [expanded, setExpanded] = useState<string[]>(["auth", "content"]);

    const toggle = (id: string) => {
        setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }

    // --- Logic: Evidence Collection ---
    const findings: { id: string; title: string; items: { text: string; status: 'pass' | 'fail' | 'warn' }[] }[] = [];

    // 1. Authentication Findings
    const authItems: { text: string; status: 'pass' | 'fail' | 'warn' }[] = [];
    if (auth.spf.status === 'pass') {
        authItems.push({ text: `SPF Check Passed (${auth.spf.details || 'IP Authorized'})`, status: 'pass' as const });
    } else {
        authItems.push({ text: `SPF Check Failed (${auth.spf.status}) - Sending IP not authorized`, status: 'fail' as const });
    }

    if (auth.dkim.status === 'pass') {
        authItems.push({ text: `DKIM Signature Valid (${auth.dkim.details || 'Signed'})`, status: 'pass' as const });
    } else {
        authItems.push({ text: `DKIM Check Failed (${auth.dkim.status})`, status: 'fail' as const });
    }

    if (auth.dmarc.status === 'pass') {
        authItems.push({ text: `DMARC Alignment Verified (Policy: ${auth.dmarc.details || 'None'})`, status: 'pass' as const });
    } else {
        authItems.push({ text: `DMARC Check Failed (Policy: ${auth.dmarc.details})`, status: 'fail' as const });
    }

    findings.push({ id: 'auth', title: 'Authentication Verification', items: authItems });

    // 2. Content & Threat Findings
    const anomalyItems: { text: string; status: 'pass' | 'fail' | 'warn' }[] = [];

    // Impersonation
    if (impersonationAlert) {
        anomalyItems.push({ text: `Impersonation Risk: ${impersonationAlert}`, status: 'fail' as const });
    }

    // Signals/Score Factors
    // Fix: Use penalties from the full scoring engine (includes body/cross analysis)
    scoring.trust.penalties.forEach(penalty => {
        // Filter out redundant auth penalties that are already covered by the auth section
        if (penalty.source === 'header' && (penalty.reason.includes('SPF') || penalty.reason.includes('DKIM') || penalty.reason.includes('DMARC'))) {
            return;
        }

        const status = penalty.critical ? 'fail' : 'warn';
        anomalyItems.push({ text: penalty.reason, status: status as 'fail' | 'warn' });
    });

    // If completely clean
    if (anomalyItems.length === 0 && !impersonationAlert) {
        anomalyItems.push({ text: "No content-based anomalies detected by active scanners.", status: 'pass' as const });
    }

    findings.push({ id: 'content', title: 'Content & Threat Indicators', items: anomalyItems });


    // --- Status Determination ---
    // --- Status Determination ---
    const getStatusTheme = () => {
        // Use scoring verdict
        const v = verdict.verdict;
        if (v === 'High Risk') return { color: 'border-rose-500', icon: ShieldAlert, text: 'text-rose-500' };
        if (v === 'Suspicious') return { color: 'border-amber-500', icon: AlertTriangle, text: 'text-amber-500' };
        return { color: 'border-emerald-500', icon: ShieldCheck, text: 'text-emerald-500' };
    };
    const theme = getStatusTheme();

    return (
        <Card className={cn("border-l-4 shadow-sm relative overflow-hidden", theme.color)}>
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-2">
                    <Sparkles className={cn("w-5 h-5", theme.text)} />
                    <CardTitle className="text-base font-bold font-mono uppercase tracking-tight flex-1">
                        MXLens Intelligence Summary
                    </CardTitle>
                    {/* Badge Removed as requested */}
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">

                {findings.map(section => (
                    <div key={section.id} className="space-y-2">
                        <button
                            onClick={() => toggle(section.id)}
                            className="flex items-center gap-2 w-full text-left text-xs font-bold uppercase text-muted-foreground hover:text-foreground transition-colors group"
                        >
                            {expanded.includes(section.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            {section.title}
                            <div className="h-px flex-1 bg-border/50 group-hover:bg-border transition-colors" />
                        </button>

                        {expanded.includes(section.id) && (
                            <div className="space-y-2 pl-2">
                                {section.items.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm">
                                        <div className="mt-1">
                                            {item.status === 'pass' && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                                            {item.status === 'fail' && <ShieldAlert className="w-3 h-3 text-rose-500" />}
                                            {item.status === 'warn' && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                                        </div>
                                        <span className={cn(
                                            "leading-tight",
                                            item.status === 'fail' ? "text-rose-600 dark:text-rose-400 font-medium" :
                                                item.status === 'warn' ? "text-amber-600 dark:text-amber-400" :
                                                    "text-muted-foreground"
                                        )}>
                                            {item.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

            </CardContent>
        </Card>
    );
}
