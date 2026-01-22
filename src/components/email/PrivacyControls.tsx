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
    // Compact Toolbar Mode (Default for Dashboard)
    return (
        <div className="flex items-center gap-4 text-xs bg-background/50 backdrop-blur-sm border rounded-lg px-3 py-1.5 shadow-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground border-r pr-3 mr-1">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-medium hidden sm:inline">Privacy Controls</span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none text-foreground hover:text-primary transition-colors">
                <Switch
                    id="body-mode"
                    checked={analyzeBody}
                    onCheckedChange={setAnalyzeBody}
                    className="scale-75 origin-left data-[state=checked]:bg-primary"
                />
                <span>Analyze Body</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none text-foreground hover:text-primary transition-colors">
                <Switch
                    id="att-mode"
                    checked={analyzeAttachments}
                    onCheckedChange={setAnalyzeAttachments}
                    className="scale-75 origin-left data-[state=checked]:bg-primary"
                />
                <span>Scan Attachments</span>
            </label>
        </div>
    );
}
