import { AlertTriangle, ShieldCheck, ShieldAlert, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisRecommendationsProps {
    verdict: "Likely Legitimate" | "Suspicious" | "High Risk" | "Unknown";
}

export function AnalysisRecommendations({ verdict }: AnalysisRecommendationsProps) {

    // --- Scenario A: Clean ---
    if (verdict === 'Likely Legitimate') {
        return (
            <div className="border border-l-4 border-l-emerald-500 rounded-lg overflow-hidden bg-card shadow-sm">
                <div className="bg-emerald-500/10 p-3 border-b border-border/50 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 text-sm">Standard Validity Checks</h3>
                </div>
                <div className="p-4 space-y-4">
                    <div className="space-y-2">
                        <div className="text-sm text-foreground/80 leading-relaxed">
                            Based on available data, no active threats were identified. Continue with standard vigilance.
                        </div>
                    </div>

                    <div className="bg-muted/30 p-3 rounded-md border text-sm">
                        <div className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Social Engineering Warning
                        </div>
                        <p className="text-muted-foreground text-xs leading-relaxed mb-2">
                            Even technically safe emails can act as vehicles for fraud. Always verify:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs ml-1">
                            <li><span className="font-medium text-foreground">Financial Requests:</span> Call sender at a known number.</li>
                            <li><span className="font-medium text-foreground">Password Resets:</span> Use official website, do not click email links.</li>
                            <li><span className="font-medium text-foreground">Urgency:</span> Ignore pressure tactics. Verify via Teams/Slack.</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    // --- Scenario B: Suspicious ---
    if (verdict === 'Suspicious') {
        return (
            <div className="border border-l-4 border-l-amber-500 rounded-lg overflow-hidden bg-card shadow-sm">
                <div className="bg-amber-500/10 p-3 border-b border-border/50 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100 text-sm">Security Anomalies Detected</h3>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-bold text-sm mb-3">YOU SHOULD:</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                            <li><span className="text-foreground font-medium">STOP.</span> Do NOT click links or open attachments.</li>
                            <li><span className="text-foreground font-medium">VERIFY.</span> Contact sender via a separate channel (Phone/Teams).</li>
                            <li><span className="text-foreground font-medium">REPORT.</span> If unverified, forward to IT Security.</li>
                        </ol>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-950/10 p-3 rounded-md border border-rose-100 dark:border-rose-900/30">
                        <h4 className="font-bold text-sm mb-3 text-rose-700 dark:text-rose-400">DO NOT:</h4>
                        <ul className="space-y-2 text-sm text-rose-600 dark:text-rose-300">
                            <li className="flex items-center gap-2"><XCircle className="w-4 h-4 shrink-0" /> Reply to this email directly.</li>
                            <li className="flex items-center gap-2"><XCircle className="w-4 h-4 shrink-0" /> Forward to colleagues.</li>
                            <li className="flex items-center gap-2"><XCircle className="w-4 h-4 shrink-0" /> Act on financial requests.</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    // --- Scenario C: High Risk / Critical ---
    return (
        <div className="border border-l-4 border-l-rose-600 rounded-lg overflow-hidden bg-card shadow-sm">
            <div className="bg-rose-600 p-3 flex items-center gap-2 text-white">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
                <h3 className="font-bold text-sm">CRITICAL THREAT DETECTED</h3>
            </div>
            <div className="p-5">
                <div className="mb-6">
                    <p className="text-rose-600 dark:text-rose-400 font-bold mb-1">IMMEDIATE ACTION REQUIRED</p>
                    <p className="text-sm text-muted-foreground">This email exhibits strong indicators of malicious intent (Phishing/Malware).</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-500" /> YOU MUST:
                        </h4>
                        <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
                            <li><span className="text-foreground font-bold">Do NOT interact.</span> Close this email immediately.</li>
                            <li><span className="text-foreground font-bold">DELETE.</span> Remove from inbox and trash.</li>
                            <li><span className="text-foreground font-bold">ESCALATE.</span> Report to security team immediately.</li>
                        </ol>
                    </div>

                    <div className="bg-muted p-4 rounded-lg text-sm">
                        <h4 className="font-bold mb-3 flex items-center gap-2">
                            <Info className="w-4 h-4" /> Usage if link clicked:
                        </h4>
                        <ul className="space-y-2 text-muted-foreground">
                            <li>1. Change your password immediately.</li>
                            <li>2. Disconnect device from network.</li>
                            <li>3. Call IT Security Emergency Line.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
