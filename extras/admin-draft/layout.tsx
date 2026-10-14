import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import {
    LayoutDashboard,
    Users,
    Building2,
    Settings,
    ShieldAlert,
    LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const navItems = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/organizations", label: "Organizations", icon: Building2 },
        { href: "/admin/risk-rules", label: "Risk Rules", icon: ShieldAlert },
        { href: "/admin/settings", label: "Settings", icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-muted/10">
            {/* Sidebar */}
            <aside className="w-64 bg-card border-r flex flex-col hidden md:flex">
                <div className="p-6 border-b">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <span className="text-primary">MX</span>Lens
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded ml-2">ADMIN</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {session.user.name?.[0] || 'A'}
                        </div>
                        <div className="text-xs">
                            <div className="font-medium text-foreground">{session.user.name}</div>
                            <div className="text-muted-foreground truncate w-32">{session.user.email}</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
