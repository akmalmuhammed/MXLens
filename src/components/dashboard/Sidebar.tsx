"use client";

import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    CreditCard,
    History,
    Settings,
    FileText,
    LogOut,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";

const sidebarItems = [
    {
        title: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Analysis History",
        href: "/dashboard/history",
        icon: History,
    },
    {
        title: "Documents & Privacy",
        href: "/dashboard/documents",
        icon: FileText,
    },
    {
        title: "Subscription",
        href: "/dashboard/billing",
        icon: CreditCard,
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings,
    },
];

export function DashboardSidebar({
    dailyUsage = 0,
    planTier = "FREE"
}: {
    dailyUsage?: number;
    planTier?: string;
}) {
    const pathname = usePathname();
    const { signOut } = useClerk();
    const dailyLimit = 10;
    const usagePercent = (dailyUsage / dailyLimit) * 100;

    // Calculate time until midnight reset
    const [timeUntilReset, setTimeUntilReset] = useState("");

    useEffect(() => {
        const updateResetTime = () => {
            const now = new Date();
            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0);
            const diff = midnight.getTime() - now.getTime();

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            setTimeUntilReset(`${hours}h ${minutes}m`);
        };

        updateResetTime();
        const interval = setInterval(updateResetTime, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const isPro = planTier !== "FREE";

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-muted/10 md:flex border-border/50 bg-card">
            <div className="flex h-14 items-center border-b border-border/50 px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
                    <div className="relative h-6 w-24">
                        <Image
                            src="/logo.png"
                            alt="MXLens Logo"
                            fill
                            className="object-contain dark:invert"
                            priority
                        />
                    </div>
                </Link>
            </div>

            <div className="flex-1 overflow-auto py-2">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group relative flex items-center gap-3 rounded-md px-3 py-2.5 transition-all outline-none",
                                pathname === item.href
                                    ? "bg-cyan-50 dark:bg-primary/10 text-cyan-900 dark:text-primary font-bold shadow-sm"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {/* Glow Bar (Dark Mode Only) */}
                            {pathname === item.href && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary shadow-[0_0_12px_rgba(0,217,255,0.6)] hidden dark:block" />
                            )}

                            <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", pathname === item.href ? "text-cyan-700 dark:text-primary" : "group-hover:text-foreground")} />
                            <span className="truncate">{item.title}</span>
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-4 border-t border-border/50 space-y-4">
                <div className={cn(
                    "rounded-lg p-4 shadow-sm",
                    isPro
                        ? "bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20"
                        : "bg-muted/50 border border-primary/20"
                )}>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm text-foreground">
                            {isPro ? "Pro Plan" : "Free Plan"}
                        </h4>
                        {isPro && (
                            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">
                                ACTIVE
                            </span>
                        )}
                    </div>

                    {isPro ? (
                        <p className="text-xs text-muted-foreground">
                            Unlimited analyses
                        </p>
                    ) : (
                        <>
                            {/* Progress Bar */}
                            <div className="mb-2">
                                <Progress
                                    value={usagePercent}
                                    className={cn(
                                        "h-2",
                                        usagePercent >= 80 ? "[&>div]:bg-amber-500" : "",
                                        usagePercent >= 100 ? "[&>div]:bg-rose-500" : ""
                                    )}
                                />
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <span className={cn(
                                    "font-medium",
                                    usagePercent >= 100 ? "text-rose-500" :
                                        usagePercent >= 80 ? "text-amber-500" : "text-muted-foreground"
                                )}>
                                    {dailyUsage}/{dailyLimit} used
                                </span>
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {timeUntilReset}
                                </span>
                            </div>
                        </>
                    )}

                    <div className="mt-3">
                        <Link href="/dashboard/billing">
                            <Button
                                size="sm"
                                className={cn(
                                    "w-full shadow-lg",
                                    isPro
                                        ? "bg-muted text-foreground hover:bg-muted/80 shadow-none border border-border"
                                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
                                )}
                                variant="default"
                            >
                                {isPro ? "Manage Plan" : "Upgrade Pro"}
                            </Button>
                        </Link>
                    </div>
                </div>

                <button
                    onClick={() => signOut({ redirectUrl: "/" })}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
