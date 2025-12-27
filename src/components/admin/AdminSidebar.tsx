"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Building2,
    Users,
    Shield,
    CreditCard,
    Link2,
    AlertTriangle,
    ClipboardList,
    Bell,
    FileText,
    Activity,
    Settings,
    Database,
    HeadphonesIcon,
    ChevronDown,
    ChevronRight,
    Terminal,
    Menu,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
    badgeVariant?: "default" | "destructive" | "warning";
    children?: { title: string; href: string }[];
}

const navItems: NavItem[] = [
    {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
    },
    {
        title: "Organizations",
        href: "/admin/organizations",
        icon: Building2,
        children: [
            { title: "All Organizations", href: "/admin/organizations" },
            { title: "Create New", href: "/admin/organizations/new" },
        ],
    },
    {
        title: "Users",
        href: "/admin/users",
        icon: Users,
        children: [
            { title: "All Users", href: "/admin/users" },
            { title: "Platform Admins", href: "/admin/users/platform-admins" },
        ],
    },
    {
        title: "Analyses",
        href: "/admin/analyses",
        icon: Shield,
        badgeVariant: "destructive",
        children: [
            { title: "Global Feed", href: "/admin/analyses" },
            { title: "Malicious", href: "/admin/analyses/malicious" },
            { title: "Patterns", href: "/admin/analyses/patterns" },
        ],
    },
    {
        title: "Billing",
        href: "/admin/billing",
        icon: CreditCard,
        children: [
            { title: "Revenue", href: "/admin/billing" },
            { title: "Subscriptions", href: "/admin/billing/subscriptions" },
            { title: "Failed Payments", href: "/admin/billing/failed-payments" },
        ],
    },
    {
        title: "Integrations",
        href: "/admin/integrations",
        icon: Link2,
    },
    {
        title: "Security",
        href: "/admin/security",
        icon: AlertTriangle,
        badge: "!",
        badgeVariant: "warning",
    },
    {
        title: "Audit Logs",
        href: "/admin/audit",
        icon: ClipboardList,
    },
    {
        title: "Notifications",
        href: "/admin/notifications",
        icon: Bell,
    },
    {
        title: "Reports",
        href: "/admin/reports",
        icon: FileText,
    },
    {
        title: "System Health",
        href: "/admin/health",
        icon: Activity,
    },
    {
        title: "Settings",
        href: "/admin/settings",
        icon: Settings,
    },
    {
        title: "Database",
        href: "/admin/database",
        icon: Database,
    },
    {
        title: "Support Tools",
        href: "/admin/support",
        icon: HeadphonesIcon,
    },
];

interface AdminSidebarProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
}

export function AdminSidebar({ collapsed, onCollapse }: AdminSidebarProps) {
    const pathname = usePathname();
    const [openGroups, setOpenGroups] = useState<string[]>(["Organizations", "Analyses"]);

    const toggleGroup = (title: string) => {
        setOpenGroups((prev) =>
            prev.includes(title)
                ? prev.filter((t) => t !== title)
                : [...prev, title]
        );
    };

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === "/admin";
        return pathname.startsWith(href);
    };

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <Terminal className="h-4 w-4" />
                        </div>
                        <span className="font-mono text-sm font-bold text-primary">
                            MXLENS<span className="text-foreground">.admin</span>
                        </span>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onCollapse(!collapsed)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                >
                    {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1 p-2 overflow-y-auto h-[calc(100vh-4rem)]">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    const hasChildren = item.children && item.children.length > 0;
                    const isOpen = openGroups.includes(item.title);

                    if (hasChildren && !collapsed) {
                        return (
                            <Collapsible
                                key={item.title}
                                open={isOpen}
                                onOpenChange={() => toggleGroup(item.title)}
                            >
                                <CollapsibleTrigger asChild>
                                    <button
                                        className={cn(
                                            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                            active
                                                ? "bg-sidebar-accent text-primary"
                                                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="h-4 w-4 shrink-0" />
                                        <span className="flex-1 text-left">{item.title}</span>
                                        {item.badge && (
                                            <span
                                                className={cn(
                                                    "flex h-5 min-w-5 items-center justify-center rounded px-1.5 text-xs font-mono",
                                                    item.badgeVariant === "destructive"
                                                        ? "bg-destructive/20 text-destructive"
                                                        : item.badgeVariant === "warning"
                                                            ? "bg-warning/20 text-warning"
                                                            : "bg-primary/20 text-primary"
                                                )}
                                            >
                                                {item.badge}
                                            </span>
                                        )}
                                        {isOpen ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                    </button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-1 space-y-1 pl-6">
                                    {item.children?.map((child) => (
                                        <Link
                                            key={child.href}
                                            href={child.href}
                                            className={cn(
                                                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                                                pathname === child.href
                                                    ? "text-primary font-medium"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <span className="h-1 w-1 rounded-full bg-current" />
                                            {child.title}
                                        </Link>
                                    ))}
                                </CollapsibleContent>
                            </Collapsible>
                        );
                    }

                    return (
                        <Link
                            key={item.title}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors relative",
                                active
                                    ? "bg-sidebar-accent text-primary"
                                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                                collapsed && "justify-center"
                            )}
                            title={collapsed ? item.title : undefined}
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            {!collapsed && (
                                <>
                                    <span className="flex-1">{item.title}</span>
                                    {item.badge && (
                                        <span
                                            className={cn(
                                                "flex h-5 min-w-5 items-center justify-center rounded px-1.5 text-xs font-mono",
                                                item.badgeVariant === "destructive"
                                                    ? "bg-destructive/20 text-destructive"
                                                    : item.badgeVariant === "warning"
                                                        ? "bg-warning/20 text-warning"
                                                        : "bg-primary/20 text-primary"
                                            )}
                                        >
                                            {item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                            {collapsed && item.badge && (
                                <span
                                    className={cn(
                                        "absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-mono",
                                        item.badgeVariant === "destructive"
                                            ? "bg-destructive text-destructive-foreground"
                                            : item.badgeVariant === "warning"
                                                ? "bg-warning text-warning-foreground"
                                                : "bg-primary text-primary-foreground"
                                    )}
                                >
                                    {item.badge.length > 2 ? "!" : item.badge}
                                </span>
                            )}
                            {active && (
                                <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-primary" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* System Status */}
            {!collapsed && (
                <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-4">
                    <div className="flex items-center gap-2 text-xs">
                        <span className="flex h-2 w-2 rounded-full bg-secure pulse-live" />
                        <span className="font-mono text-muted-foreground">
                            System: <span className="text-secure">OPERATIONAL</span>
                        </span>
                    </div>
                </div>
            )}
        </aside>
    );
}
