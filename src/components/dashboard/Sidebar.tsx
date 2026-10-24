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
    Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export function DashboardSidebar() {
    const pathname = usePathname();
    const { signOut } = useClerk();

    return (
        <>
            <header className="flex h-14 items-center justify-between border-b border-border/50 bg-card px-4 md:hidden">
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

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="Open dashboard navigation"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] max-w-sm p-2">
                        <DropdownMenuLabel>Dashboard</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {sidebarItems.map((item) => (
                            <DropdownMenuItem
                                key={item.href}
                                asChild
                                className={cn(
                                    "h-10 cursor-pointer gap-3 px-3",
                                    pathname === item.href && "bg-primary/10 text-primary focus:bg-primary/10 focus:text-primary"
                                )}
                            >
                                <Link href={item.href}>
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.title}</span>
                                </Link>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            variant="destructive"
                            className="h-10 cursor-pointer gap-3 px-3"
                            onClick={() => signOut({ redirectUrl: "/" })}
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-border/50 bg-card md:flex">
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
                <div className="rounded-lg border border-primary/20 bg-muted/50 p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-foreground">Local Analysis</h4>
                    <p className="mt-1 text-xs text-muted-foreground">Unlimited analyses run locally.</p>
                </div>

                <button
                    onClick={() => signOut({ redirectUrl: "/" })}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </button>
            </div>
            </aside>
        </>
    );
}
