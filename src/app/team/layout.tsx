import Link from "next/link";
import { Users, FileText } from "lucide-react";

export default function TeamLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-12 min-h-screen">
            <aside className="w-full md:w-64 space-y-2">
                <h2 className="text-xl font-bold mb-6 px-4">Team Management</h2>
                <NavLink href="/team/manage" icon={Users}>Members</NavLink>
                <NavLink href="/team/audit-logs" icon={FileText}>Audit Logs</NavLink>
            </aside>

            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}

function NavLink({ href, icon: Icon, children }: any) {
    return (
        <Link href={href} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <Icon className="h-4 w-4" />
            <span className="font-medium">{children}</span>
        </Link>
    )
}
