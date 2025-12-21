import Link from "next/link";
import { User, CreditCard, Key } from "lucide-react";

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-12 min-h-screen">
            {/* Settings Query Sidebar */}
            <aside className="w-full md:w-64 space-y-2">
                <h2 className="text-xl font-bold mb-6 px-4">Settings</h2>
                <NavLink href="/settings/profile" icon={User}>Profile</NavLink>
                <NavLink href="/settings/billing" icon={CreditCard}>Billing</NavLink>
                <NavLink href="/settings/api-keys" icon={Key}>API Keys</NavLink>
            </aside>

            {/* Main Content */}
            <div className="flex-1 bg-card border border-border/50 rounded-xl p-6 md:p-8">
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
