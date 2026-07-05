import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UsageBannerProps {
    allowed: boolean;
    message?: string;
}

export function UsageBanner({ allowed, message }: UsageBannerProps) {
    if (allowed) return null;

    return (
        <div className="max-w-2xl mx-auto mb-4 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">{message}</span>
            </div>
            <Button size="sm" variant="default" onClick={() => window.location.href = "/analyze"}>
                Continue Free
            </Button>
        </div>
    );
}
