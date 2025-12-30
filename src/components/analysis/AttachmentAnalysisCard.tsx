"use client";

import { AttachmentSignal } from "@/lib/email/scoring/types";
import {
    AlertTriangle,
    FileWarning,
    Shield,
    ShieldAlert,
    FileArchive,
    Disc,
    Link2,
    Lock,
    FileX,
    FileCheck,
    Files,
    Copy
} from "lucide-react";

interface AttachmentAnalysisCardProps {
    attachments: AttachmentSignal[];
    enabled: boolean;
}

export function AttachmentAnalysisCard({ attachments, enabled }: AttachmentAnalysisCardProps) {
    if (!enabled) {
        return (
            <div className="bg-background/50 border border-border/50 rounded-xl p-4 opacity-60">
                <div className="flex items-center gap-2 mb-2">
                    <Files className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold text-muted-foreground">Attachment Analysis</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                    Enable attachment analysis to scan files for threats.
                </p>
            </div>
        );
    }

    if (attachments.length === 0) {
        return (
            <div className="bg-background/50 border border-border/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                    <FileCheck className="w-5 h-5 text-green-500" />
                    <h3 className="font-semibold">Attachment Analysis</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                    No attachments detected in this email.
                </p>
            </div>
        );
    }

    // Categorize threats
    const critical = attachments.filter(a =>
        a.isMasquerading || a.isDiskImage || (a.isShortcut && a.lnkTarget) ||
        (a.nestedFiles && a.nestedFiles.length > 0) || a.hasDoubleExtension
    );
    const warnings = attachments.filter(a =>
        !critical.includes(a) && (
            a.isExecutable || a.isScript || a.macroDetected ||
            a.isPasswordProtected || a.isShortcut
        )
    );
    const safe = attachments.filter(a => !critical.includes(a) && !warnings.includes(a));

    const hasThreats = critical.length > 0 || warnings.length > 0;

    const copyHash = (hash: string) => {
        navigator.clipboard.writeText(hash);
    };

    return (
        <div className={`border rounded-xl p-4 ${hasThreats ? 'bg-red-950/20 border-red-500/30' : 'bg-green-950/20 border-green-500/30'}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {hasThreats ? (
                        <ShieldAlert className="w-5 h-5 text-red-500" />
                    ) : (
                        <Shield className="w-5 h-5 text-green-500" />
                    )}
                    <h3 className="font-semibold">Attachment Analysis</h3>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                        {attachments.length} file{attachments.length !== 1 ? 's' : ''}
                    </span>
                </div>
                {hasThreats && (
                    <span className="text-xs font-medium text-red-400 bg-red-500/20 px-2 py-1 rounded">
                        {critical.length} Critical · {warnings.length} Warning
                    </span>
                )}
            </div>

            <div className="space-y-2">
                {/* Critical Threats */}
                {critical.map((att, idx) => (
                    <AttachmentRow key={`crit-${idx}`} attachment={att} severity="critical" onCopyHash={copyHash} />
                ))}

                {/* Warnings */}
                {warnings.map((att, idx) => (
                    <AttachmentRow key={`warn-${idx}`} attachment={att} severity="warning" onCopyHash={copyHash} />
                ))}

                {/* Safe Files */}
                {safe.map((att, idx) => (
                    <AttachmentRow key={`safe-${idx}`} attachment={att} severity="safe" onCopyHash={copyHash} />
                ))}
            </div>

            {/* Summary */}
            {hasThreats && (
                <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                        ⚠️ Do not open these attachments. They may contain malware or be designed to trick you.
                    </p>
                </div>
            )}
        </div>
    );
}

interface AttachmentRowProps {
    attachment: AttachmentSignal;
    severity: "critical" | "warning" | "safe";
    onCopyHash: (hash: string) => void;
}

function AttachmentRow({ attachment, severity, onCopyHash }: AttachmentRowProps) {
    const getIcon = () => {
        if (attachment.isDiskImage) return <Disc className="w-4 h-4" />;
        if (attachment.isShortcut) return <Link2 className="w-4 h-4" />;
        if (attachment.isArchive) return <FileArchive className="w-4 h-4" />;
        if (attachment.isPasswordProtected) return <Lock className="w-4 h-4" />;
        if (attachment.isMasquerading || attachment.isExecutable || attachment.isScript) return <FileX className="w-4 h-4" />;
        return <FileCheck className="w-4 h-4" />;
    };

    const getLabel = () => {
        const labels: string[] = [];
        if (attachment.isMasquerading) labels.push(`Masquerading as ${attachment.extension.toUpperCase()}`);
        if (attachment.isDiskImage) labels.push("Disk Image");
        if (attachment.isShortcut) labels.push("Shortcut");
        if (attachment.isPasswordProtected) labels.push("Password Protected");
        if (attachment.nestedFiles?.length) labels.push(`Contains: ${attachment.nestedFiles.join(', ')}`);
        if (attachment.lnkTarget) labels.push(`Targets: ${attachment.lnkTarget}`);
        if (attachment.hasDoubleExtension) labels.push("Double Extension");
        if (attachment.isExecutable) labels.push("Executable");
        if (attachment.isScript) labels.push("Script");
        if (attachment.macroDetected) labels.push("Contains Macros");
        if (attachment.dangerousFunctions?.length) labels.push(`Dangerous: ${attachment.dangerousFunctions.join(', ')}`);
        return labels.join(" · ") || "No threats detected";
    };

    const severityColors = {
        critical: "bg-red-500/20 border-red-500/40 text-red-300",
        warning: "bg-yellow-500/20 border-yellow-500/40 text-yellow-300",
        safe: "bg-green-500/10 border-green-500/30 text-green-300"
    };

    const iconColors = {
        critical: "text-red-500",
        warning: "text-yellow-500",
        safe: "text-green-500"
    };

    return (
        <div className={`border rounded-lg p-3 ${severityColors[severity]}`}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                    <div className={`mt-0.5 ${iconColors[severity]}`}>{getIcon()}</div>
                    <div className="min-w-0">
                        <p className="font-medium text-sm truncate" title={attachment.filename}>
                            {attachment.filename}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {(attachment.size / 1024).toFixed(1)} KB · {attachment.magicType?.toUpperCase() || attachment.extension.toUpperCase()}
                        </p>
                        {severity !== "safe" && (
                            <p className="text-xs mt-1 opacity-80">
                                {getLabel()}
                            </p>
                        )}
                    </div>
                </div>
                {attachment.sha256 && (
                    <button
                        onClick={() => onCopyHash(attachment.sha256)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0"
                        title={`SHA-256: ${attachment.sha256}`}
                    >
                        <Copy className="w-3 h-3" />
                        Hash
                    </button>
                )}
            </div>
        </div>
    );
}
