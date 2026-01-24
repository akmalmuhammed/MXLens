"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import * as Sentry from "@sentry/nextjs";
import { Logger } from "@/lib/logger";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { data: session } = useSession();

    useEffect(() => {
        if (session?.user) {
            // Identify user to Sentry
            Sentry.setUser({
                id: session.user.id,
                email: session.user.email || undefined,
                username: session.user.name || undefined,
            });

            Logger.info("Admin Dashboard Accessed", {
                userId: session.user.id,
                role: session.user.role
            });
        }
    }, [session]);

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
