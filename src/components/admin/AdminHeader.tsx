"use client";

import { useState, useEffect } from "react";
import {
    Bell,
    Search,
    ChevronDown,
    Shield,
    LogOut,
    Settings,
    User,
    AlertTriangle,
    CheckCircle2,
    Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Notification {
    id: string;
    type: "alert" | "info" | "success";
    title: string;
    message: string;
    time: string;
    read: boolean;
}

const mockNotifications: Notification[] = [
    {
        id: "1",
        type: "alert",
        title: "Critical Threat Detected",
        message: "Malicious payload identified in organization 'Acme Corp'",
        time: "2 min ago",
        read: false,
    },
    {
        id: "2",
        type: "info",
        title: "New Organization Signup",
        message: "TechStart Inc. has created a new account",
        time: "15 min ago",
        read: false,
    },
    {
        id: "3",
        type: "success",
        title: "System Update Complete",
        message: "Detection engine v2.4.1 deployed successfully",
        time: "1 hour ago",
        read: true,
    },
];

export function AdminHeader() {
    const [searchQuery, setSearchQuery] = useState("");
    const [notifications] = useState<Notification[]>(mockNotifications);
    const unreadCount = notifications.filter((n) => !n.read).length;
    const [user, setUser] = useState<{ email: string; role: string } | null>(null);

    // Fetch Admin Profile
    useEffect(() => {
        fetch("/api/admin/auth/me")
            .then((res) => res.json())
            .then((data) => {
                if (data.user) setUser(data.user);
            })
            .catch((err) => console.error("Failed to fetch admin profile", err));
    }, []);

    async function handleLogout() {
        try {
            await fetch("/api/admin/auth/logout", { method: "POST" });
            window.location.href = "/admin/auth/signin";
        } catch (error) {
            console.error("Logout failed", error);
            // Fallback redirect
            window.location.href = "/admin/auth/signin";
        }
    }

    return (
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-6">
            {/* Search */}
            <div className="flex items-center gap-4 flex-1 max-w-xl">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search organizations, users, analyses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-muted border-transparent focus:border-primary font-mono text-sm"
                    />
                    <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Live Indicator */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted border border-border">
                    <span className="flex h-2 w-2 rounded-full bg-secure pulse-live" />
                    <span className="font-mono text-xs text-muted-foreground">LIVE</span>
                </div>

                {/* Notifications */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative text-muted-foreground hover:text-foreground"
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-mono text-destructive-foreground">
                                    {unreadCount}
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                        <div className="flex items-center justify-between border-b border-border p-3">
                            <h4 className="font-medium">Notifications</h4>
                            <Button variant="ghost" size="sm" className="text-xs text-primary">
                                Mark all read
                            </Button>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex gap-3 p-3 border-b border-border last:border-0 transition-colors hover:bg-muted cursor-pointer",
                                        !notification.read && "bg-muted/50"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                                            notification.type === "alert" && "bg-destructive/20 text-destructive",
                                            notification.type === "info" && "bg-primary/20 text-primary",
                                            notification.type === "success" && "bg-secure/20 text-secure"
                                        )}
                                    >
                                        {notification.type === "alert" && <AlertTriangle className="h-4 w-4" />}
                                        {notification.type === "info" && <Bell className="h-4 w-4" />}
                                        {notification.type === "success" && <CheckCircle2 className="h-4 w-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{notification.title}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {notification.time}
                                        </div>
                                    </div>
                                    {!notification.read && (
                                        <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-border p-2">
                            <Button variant="ghost" className="w-full text-sm">
                                View all notifications
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center gap-2 px-2 hover:bg-muted"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                <Shield className="h-4 w-4" />
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium">{user?.email || "Admin User"}</p>
                                <p className="text-xs text-muted-foreground font-mono">{user?.role || "Loading..."}</p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive cursor-pointer"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
