"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { cn } from "@/lib/utils";
import * as Sentry from "@sentry/nextjs";
import { Logger } from "@/lib/logger";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { user, isSignedIn } = useUser();

    useEffect(() => {
        if (isSignedIn && user) {
            Sentry.setUser({
                id: user.id,
                email: user.primaryEmailAddress?.emailAddress || undefined,
                username: user.fullName || user.username || undefined,
            });

            Logger.info("Admin Dashboard Accessed", {
                clerkUserId: user.id
            });
        }
    }, [isSignedIn, user]);

    return (
        <div className="min-h-screen bg-background cyber-grid">
            {/* Hide the main app navbar by applying negative margin or using a portal */}
            <style jsx global>{`
                /* Hide main app navigation on admin routes */
                nav.z-50:not(.admin-nav) {
                    display: none !important;
                }
            `}</style>

            <AdminSidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />

            <div
                className={cn(
                    "transition-all duration-300",
                    sidebarCollapsed ? "ml-16" : "ml-64"
                )}
            >
                <AdminHeader />
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
