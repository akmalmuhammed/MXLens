import { ValidationPenalty } from "@/lib/email/scoring/types";
import { AlertTriangle, Lock, Eye, FileWarning, ExternalLink, ShieldAlert, Link } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhishingIndicatorsPanelProps {
    penalties: ValidationPenalty[];

    bodyEnabled: boolean;
    onEnableBody: () => void;
}

export function PhishingIndicatorsPanel({ penalties, bodyEnabled, onEnableBody }: PhishingIndicatorsPanelProps) {
    if (!bodyEnabled) {
        return (
            <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/10">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Lock className="w-4 h-4 flex-shrink-0" />
                    <span>Body analysis disabled — enable to detect phishing links & hidden forms</span>
                </div>
                <Button variant="ghost" size="sm" onClick={onEnableBody} className="gap-1.5 text-xs h-7 px-2">
                    <Eye className="w-3 h-3" /> Enable
                </Button>
            </div>
        );
    }

    const bodyRisks = penalties.filter(p => p.source === 'body');
    const crossRisks = penalties.filter(p => p.source === 'cross');
    const attachmentRisks = penalties.filter(p => p.source === 'attachment');
    // We treat 'header' risks as separate usually shown in Header Analysis, 
    // but if critical we might show them? For now focus on Phishing Analysis (Content/Cross).

    if (bodyRisks.length === 0 && crossRisks.length === 0 && attachmentRisks.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <ShieldAlert className="w-8 h-8 mx-auto opacity-20 mb-2" />
                <p>No significant phishing indicators found in body content.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in transition-all">

            {/* Body Risks */}
            {bodyRisks.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-md p-4 dark:bg-red-950/20 dark:border-red-900/30">
                    <h4 className="font-semibold text-red-800 dark:text-red-400 text-sm mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Suspicious Content Indicators
                    </h4>
                    <div className="space-y-2">
                        {bodyRisks.map((risk, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                                <span className="font-bold text-xs border border-red-200 bg-red-100 px-1.5 rounded text-red-800">
                                    {risk.value}
                                </span>
                                <div>{risk.reason}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Cross Context Risks */}
            {crossRisks.length > 0 && (
                <div className="bg-orange-50 border border-orange-100 rounded-md p-4 dark:bg-orange-950/20 dark:border-orange-900/30">
                    <h4 className="font-semibold text-orange-800 dark:text-orange-400 text-sm mb-3 flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Correlation Warnings (BEC/Impersonation)
                    </h4>
                    <div className="space-y-2">
                        {crossRisks.map((risk, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-orange-700 dark:text-orange-300">
                                <span className="font-bold text-xs border border-orange-200 bg-orange-100 px-1.5 rounded text-orange-800">
                                    {risk.value}
                                </span>
                                <div>{risk.reason}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Attachment Risks */}
            {attachmentRisks.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4 dark:bg-yellow-950/20 dark:border-yellow-900/30">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-400 text-sm mb-3 flex items-center gap-2">
                        <FileWarning className="w-4 h-4" />
                        Attachment Risks
                    </h4>
                    <div className="space-y-2">
                        {attachmentRisks.map((risk, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                                <span className="font-bold text-xs border border-yellow-200 bg-yellow-100 px-1.5 rounded text-yellow-800">
                                    {risk.value}
                                </span>
                                <div>{risk.reason}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}



        </div>
    );
}
