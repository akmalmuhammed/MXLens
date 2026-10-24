import { DashboardSidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40 md:flex-row">
            <DashboardSidebar />
            <div className="flex min-h-screen min-w-0 flex-1 flex-col">
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
