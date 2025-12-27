import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon: React.ElementType;
    variant?: "default" | "primary" | "secure" | "warning" | "destructive";
    trend?: "up" | "down" | "neutral";
}

export function MetricCard({
    title,
    value,
    change,
    changeLabel = "vs last period",
    icon: Icon,
    variant = "default",
    trend,
}: MetricCardProps) {
    const getTrendIcon = () => {
        if (trend === "up") return <ArrowUp className="h-3 w-3" />;
        if (trend === "down") return <ArrowDown className="h-3 w-3" />;
        return <Minus className="h-3 w-3" />;
    };

    const getTrendColor = () => {
        if (trend === "up") return "text-secure";
        if (trend === "down") return "text-destructive";
        return "text-muted-foreground";
    };

    const getIconBg = () => {
        switch (variant) {
            case "primary":
                return "bg-primary/20 text-primary";
            case "secure":
                return "bg-secure/20 text-secure";
            case "warning":
                return "bg-warning/20 text-warning";
            case "destructive":
                return "bg-destructive/20 text-destructive";
            default:
                return "bg-muted text-muted-foreground";
        }
    };

    return (
        <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-glow">
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-muted-foreground">{title}</span>
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-md", getIconBg())}>
                        <Icon className="h-4 w-4" />
                    </div>
                </div>

                {/* Value */}
                <div className="mb-2">
                    <span className="text-3xl font-bold font-mono tracking-tight">{value}</span>
                </div>

                {/* Change indicator */}
                {change !== undefined && (
                    <div className="flex items-center gap-1">
                        <span className={cn("flex items-center gap-0.5 text-sm font-medium", getTrendColor())}>
                            {getTrendIcon()}
                            {Math.abs(change)}%
                        </span>
                        <span className="text-xs text-muted-foreground">{changeLabel}</span>
                    </div>
                )}
            </div>

            {/* Corner accent */}
            <div
                className={cn(
                    "absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40",
                    variant === "primary" && "bg-primary",
                    variant === "secure" && "bg-secure",
                    variant === "warning" && "bg-warning",
                    variant === "destructive" && "bg-destructive",
                    variant === "default" && "bg-primary"
                )}
            />
        </div>
    );
}
