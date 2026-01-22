import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, Lock } from "lucide-react";

interface PrivacyControlsProps {
    analyzeBody: boolean;
    setAnalyzeBody: (v: boolean) => void;
    analyzeAttachments: boolean;
    setAnalyzeAttachments: (v: boolean) => void;
    minimal?: boolean;
}

export function PrivacyControls({ analyzeBody, setAnalyzeBody, analyzeAttachments, setAnalyzeAttachments, minimal }: PrivacyControlsProps) {
    // Ultra-compact inline controls
    return (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-foreground transition-colors">
                <Switch
                    id="body-mode"
                    checked={analyzeBody}
                    onCheckedChange={setAnalyzeBody}
                    className="scale-[0.65] origin-left"
                />
                <span>Body</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-foreground transition-colors">
                <Switch
                    id="att-mode"
                    checked={analyzeAttachments}
                    onCheckedChange={setAnalyzeAttachments}
                    className="scale-[0.65] origin-left"
                />
                <span>Attachments</span>
            </label>
        </div>
    );
}
