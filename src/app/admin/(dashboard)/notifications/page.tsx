"use client";

import { Bell, Check, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Bell className="h-6 w-6 text-primary" />
                        Notifications
                    </h1>
                    <p className="text-muted-foreground font-mono text-sm">
                        System notifications and alerts
                    </p>
                </div>
                <Button variant="outline" className="gap-2">
                    <Check className="h-4 w-4" />
                    Mark All Read
                </Button>
            </div>

            <div className="rounded-lg border border-border bg-card p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
                <p className="text-muted-foreground text-sm">
                    You're all caught up! No new notifications.
                </p>
            </div>
        </div>
    );
}
