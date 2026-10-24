import { useId } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface PrivacyControlsProps {
    analyzeBody: boolean;
    setAnalyzeBody: (v: boolean) => void;
    analyzeAttachments: boolean;
    setAnalyzeAttachments: (v: boolean) => void;
    minimal?: boolean;
    idPrefix?: string;
}

export function PrivacyControls({
    analyzeBody,
    setAnalyzeBody,
    analyzeAttachments,
    setAnalyzeAttachments,
    minimal = false,
    idPrefix = "analysis-privacy"
}: PrivacyControlsProps) {
    const instanceId = useId();
    const bodyId = `${idPrefix}-${instanceId}-body`;
    const attachmentsId = `${idPrefix}-${instanceId}-attachments`;

    return (
        <div
            className={`flex items-center ${minimal ? "gap-1.5" : "gap-2"} text-[11px] text-muted-foreground`}
            role="group"
            aria-label="Privacy analysis settings"
        >
            <div className="flex items-center gap-1.5 cursor-pointer select-none hover:text-foreground transition-colors">
                <Switch
                    id={bodyId}
                    checked={analyzeBody}
                    onCheckedChange={setAnalyzeBody}
                    className="scale-[0.65] origin-left"
                    aria-label="Analyze email body content"
                    aria-describedby={`${bodyId}-state`}
                />
                <Label htmlFor={bodyId} className="cursor-pointer text-[11px] font-normal">Body</Label>
                <span id={`${bodyId}-state`} className="sr-only">
                    Body analysis is {analyzeBody ? "enabled" : "disabled"}.
                </span>
            </div>

            <div className="flex items-center gap-1.5 cursor-pointer select-none hover:text-foreground transition-colors">
                <Switch
                    id={attachmentsId}
                    checked={analyzeAttachments}
                    onCheckedChange={setAnalyzeAttachments}
                    className="scale-[0.65] origin-left"
                    aria-label="Analyze email attachments"
                    aria-describedby={`${attachmentsId}-state`}
                />
                <Label htmlFor={attachmentsId} className="cursor-pointer text-[11px] font-normal">Attachments</Label>
                <span id={`${attachmentsId}-state`} className="sr-only">
                    Attachment analysis is {analyzeAttachments ? "enabled" : "disabled"}.
                </span>
            </div>
        </div>
    );
}
