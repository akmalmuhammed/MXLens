import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { getDashboardStats } from "@/actions/dashboard";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const stats = await getDashboardStats();

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40 md:flex-row">
            <DashboardSidebar
                dailyUsage={stats.dailyScans}
                planTier={stats.isPremium ? "PRO" : "FREE"}
            />
            <div className="flex flex-col flex-1 min-h-screen">
                <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 md:hidden">
                    {/* Mobile Header Placeholder */}
                    <span className="font-bold">MXLens Dashboard</span>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
