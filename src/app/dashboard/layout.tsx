import { DashboardSidebar } from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Note: RootLayout already provides the html/body. This is a nested layout.
    // However, RootLayout INCLUDES the main Navbar. 
    // Usually dashboards have a different layout. 
    // We might want to HIDE the main Navbar in RootLayout if /dashboard? 
    // Or just let it be efficiently separate.
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40 md:flex-row">
            <DashboardSidebar />
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
