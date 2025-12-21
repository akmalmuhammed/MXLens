import { AnalysisResult } from "@/lib/email/HeaderParser";
import { Sparkles, ShieldCheck, ShieldAlert, AlertTriangle, Fingerprint, Lock, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AIAnalysisSummaryProps {
    analysis: AnalysisResult;
}

export function AIAnalysisSummary({ analysis }: AIAnalysisSummaryProps) {
    const { verdict, auth, impersonationAlert, scoreFactors } = analysis;

    // --- Logic Verification Layer (Simulating AI Reasoning) ---
    // We construct a narrative based on deterministic signals.

    const getNarrative = () => {
        const points: string[] = [];
        let headline = "";
        let sentiment: "positive" | "caution" | "negative" = "positive";

        // 1. Verdict & Headline
        if (verdict === 'likely_legit') {
            headline = "This email appears safe and authentic.";
            sentiment = "positive";
            points.push("The sender's identity has been verified via strong authentication (DMARC/SPF).");
        } else if (verdict === 'high_risk') {
            headline = "High risk detected. This email shows strong signs of phishing.";
            sentiment = "negative";
        } else if (verdict === 'suspicious') {
            headline = "Exercise caution. This email has several suspicious traits.";
            sentiment = "caution";
        } else {
            headline = "Analysis inconclusive. Proceed with care.";
            sentiment = "caution";
        }

        // 2. Auth Context
        if (auth.dmarc.status === 'fail') {
            points.push(`Risk: The email claims to be from "${analysis.headers['From']}" but failed DMARC validation. The domain owner did not authorize this server.`);
        } else if (auth.spf.status === 'fail' || auth.spf.status === 'softfail') {
            points.push(`Risk: The sending server IP is not on the allowed list for this domain (SPF ${auth.spf.status}).`);
        }

        // 3. Impersonation Context
        if (impersonationAlert) {
            points.push(`Critical: ${impersonationAlert}`);
        }

        // 4. Positive Reinforcement
        if (analysis.score >= 80) {
            points.push("Trust signals are high, indicating a legitimate business communication.");
        }

        // 5. Mixed Signals
        if (verdict === 'suspicious' && auth.dmarc.status === 'pass') {
            points.push("Although authentication passed, other content signals (like hidden text or aggressive urgency) raised flags.");
        }

        return { headline, points, sentiment };
    };

    const narrative = getNarrative();

    return (
        <Card className={cn(
            "border-l-4 shadow-sm relative overflow-hidden transition-all duration-300",
            narrative.sentiment === 'positive' ? "border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10" :
                narrative.sentiment === 'negative' ? "border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/10" :
                    "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/10"

        )}>
            {/* "AI" Decorative Elements */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Sparkles className="w-24 h-24" />
            </div>

            <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-1">
                    <div className={cn("p-1.5 rounded-md",
                        narrative.sentiment === 'positive' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" :
                            narrative.sentiment === 'negative' ? "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400" :
                                "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                    )}>
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">MXLens Intelligence Summary</span>
                </div>
                <CardTitle className="text-lg font-heading leading-tight">
                    {narrative.headline}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {narrative.points.map((point, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-sm text-foreground/80">
                            {/* Contextual Icons based on keywords */}
                            <div className="mt-0.5 shrink-0">
                                {point.includes("Risk") || point.includes("Critical") ? <ShieldAlert className="w-4 h-4 text-rose-500" /> :
                                    point.includes("identity") ? <Fingerprint className="w-4 h-4 text-blue-500" /> :
                                        point.includes("server") ? <Globe className="w-4 h-4 text-purple-500" /> :
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                }
                            </div>
                            <p dangerouslySetInnerHTML={{ __html: highlightKeywords(point) }} />
                        </div>
                    ))}
                </div>

                {/* Technical Translation */}
                <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 lg:grid-cols-3 gap-2">
                    <div className="text-xs">
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Identity</span>
                        <div className="flex items-center gap-1.5 mt-1 font-medium">
                            {auth.dmarc.status === 'pass' ? <ShieldCheck className="w-3 h-3 text-emerald-500" /> : <Lock className="w-3 h-3 text-muted-foreground" />}
                            {auth.dmarc.status === 'pass' ? 'Verified' : 'Unverified'}
                        </div>
                    </div>
                    <div className="text-xs">
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Path</span>
                        <div className="flex items-center gap-1.5 mt-1 font-medium">
                            {analysis.hops.length > 2 ? <Globe className="w-3 h-3 text-blue-500" /> : <AlertTriangle className="w-3 h-3 text-amber-500" />}
                            {analysis.hops.length} Hops Recorded
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Helper to embolden key terms
function highlightKeywords(text: string) {
    const keywords = ["High Risk", "DMARC", "SPF", "impersonating", "verified", "safe", "Critical", "Authentication", "Phishing"];
    let out = text;
    keywords.forEach(w => {
        const reg = new RegExp(`(${w})`, 'gi');
        out = out.replace(reg, '<span class="font-semibold text-foreground">$1</span>');
    });
    return out;
}
