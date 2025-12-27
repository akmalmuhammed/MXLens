"use client";

import { useEffect, useState } from "react";
import {
    AlertTriangle,
    CreditCard,
    Shield,
    UserPlus,
    AlertCircle,
    CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
    id: string;
    type: "threat" | "signup" | "payment" | "analysis" | "error" | "success";
    title: string;
    description: string;
    timestamp: string;
    meta?: string;
}

const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
        case "threat":
            return AlertTriangle;
        case "signup":
            return UserPlus;
        case "payment":
            return CreditCard;
        case "analysis":
            return Shield;
        case "error":
            return AlertCircle;
        case "success":
            return CheckCircle2;
    }
};

const getActivityStyle = (type: Activity["type"]) => {
    switch (type) {
        case "threat":
            return "bg-destructive/20 text-destructive border-destructive/30";
        case "signup":
            return "bg-primary/20 text-primary border-primary/30";
        case "payment":
            return "bg-secure/20 text-secure border-secure/30";
        case "analysis":
            return "bg-muted text-muted-foreground border-border";
        case "error":
            return "bg-warning/20 text-warning border-warning/30";
        case "success":
            return "bg-secure/20 text-secure border-secure/30";
    }
};

export function RecentActivityFeed() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchActivity() {
            try {
                const res = await fetch("/api/admin/dashboard/activity");
                if (!res.ok) throw new Error("Failed to fetch activity");
                const json = await res.json();
                setActivities(json.activities || []);
            } catch (error) {
                console.error("Failed to fetch activity:", error);
                setActivities([]);
            } finally {
                setLoading(false);
            }
        }
        fetchActivity();
    }, []);

    return (
        <div className="rounded-lg border border-border bg-card">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Live Activity</h3>
                    <span className="flex h-2 w-2 rounded-full bg-secure pulse-live" />
                </div>
                <button className="text-sm text-primary hover:underline">View all</button>
            </div>

            {/* Activity List */}
            <div className="divide-y divide-border">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading...</div>
                ) : activities.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No recent activity</div>
                ) : (
                    activities.map((activity, index) => {
                        const Icon = getActivityIcon(activity.type);
                        return (
                            <div
                                key={activity.id}
                                className={cn(
                                    "flex gap-3 p-4 transition-colors hover:bg-muted/50 cursor-pointer opacity-0 animate-fade-in",
                                    `stagger-${Math.min(index + 1, 6)}`
                                )}
                            >
                                <div
                                    className={cn(
                                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border",
                                        getActivityStyle(activity.type)
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium text-sm truncate">{activity.title}</p>
                                        {activity.meta && (
                                            <span
                                                className={cn(
                                                    "text-[10px] font-mono px-1.5 py-0.5 rounded",
                                                    activity.type === "threat"
                                                        ? "bg-destructive/20 text-destructive"
                                                        : "bg-muted text-muted-foreground"
                                                )}
                                            >
                                                {activity.meta}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {activity.description}
                                    </p>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {activity.timestamp}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
