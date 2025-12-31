"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap, Crown } from "lucide-react";
import Link from "next/link";

interface UsageData {
    planTier: string;
    usage: {
        used: number;
        limit: number;
        remaining: number;
        percentUsed: number;
    };
    resetsIn: number;
}

export function QuotaIndicator() {
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUsage() {
            try {
                const res = await fetch("/api/usage");
                if (res.ok) {
                    const data = await res.json();
                    setUsage(data);
                }
            } catch (error) {
                console.error("Failed to fetch usage:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchUsage();
    }, []);

    if (loading || !usage) {
        return null;
    }

    const isLow = usage.usage.remaining <= 3 && usage.planTier === "FREE";
    const isFree = usage.planTier === "FREE";

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 hover:bg-muted transition-colors cursor-default">
                        {isFree ? (
                            <Zap className={`w-3.5 h-3.5 ${isLow ? 'text-amber-500' : 'text-muted-foreground'}`} />
                        ) : (
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span className={`text-xs font-medium ${isLow ? 'text-amber-500' : 'text-muted-foreground'}`}>
                            {usage.usage.remaining}/{usage.usage.limit}
                        </span>
                        <Progress
                            value={usage.usage.percentUsed}
                            className={`w-12 h-1.5 ${isLow ? '[&>div]:bg-amber-500' : ''}`}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-2 p-1">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Daily Analyses</span>
                            <Badge variant="outline" className="text-xs">
                                {usage.planTier}
                            </Badge>
                        </div>
                        <div className="text-sm">
                            <span className="font-bold">{usage.usage.used}</span>
                            <span className="text-muted-foreground"> of </span>
                            <span className="font-bold">{usage.usage.limit}</span>
                            <span className="text-muted-foreground"> used today</span>
                        </div>
                        <Progress value={usage.usage.percentUsed} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                            Resets in {usage.resetsIn} hours
                        </p>
                        {isFree && isLow && (
                            <Link
                                href="/pricing"
                                className="block text-xs text-cyan-500 hover:text-cyan-400 font-medium mt-2"
                            >
                                Upgrade for unlimited →
                            </Link>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
