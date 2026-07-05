import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const MOCK_NOTIFICATIONS = [
    {
        id: 1,
        title: "High Risk Verdict: invoice_urgent.pdf.exe",
        message: "Analysis completed. 3 engines flagged this file as malicious.",
        type: "alert",
        read: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 5) // 5 mins ago
    },
    {
        id: 2,
        title: "Free Analysis Enabled",
        message: "MXLens email analysis is now free and does not require signup.",
        type: "info",
        read: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
    },
    {
        id: 3,
        title: "Welcome to MXLens!",
        message: "Thanks for joining. Check out our getting started guide.",
        type: "info",
        read: true,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
    }
];

export default function NotificationsInboxPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Inbox</h1>
                    <p className="text-muted-foreground">Alerts and updates.</p>
                </div>
                <Button variant="outline" size="sm">Mark all as read</Button>
            </div>

            <div className="space-y-4">
                {MOCK_NOTIFICATIONS.map((n) => (
                    <div
                        key={n.id}
                        className={cn(
                            "p-4 rounded-xl border flex gap-4 transition-all hover:border-primary/50",
                            n.read ? "bg-background border-border opacity-70" : "bg-card border-border shadow-sm"
                        )}
                    >
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                            n.type === 'alert' ? "bg-red-500/10 text-red-500" :
                                n.type === 'warning' ? "bg-amber-500/10 text-amber-500" :
                                    "bg-blue-500/10 text-blue-500"
                        )}>
                            <Bell className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className={cn("font-semibold", !n.read && "text-foreground")}>{n.title}</h3>
                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                    {formatDistanceToNow(n.timestamp)} ago
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{n.message}</p>
                            <div className="flex gap-2">
                                {!n.read && (
                                    <Button size="sm" variant="ghost" className="h-7 text-xs px-2">
                                        <Check className="w-3 h-3 mr-1" /> Mark Read
                                    </Button>
                                )}
                                <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-muted-foreground hover:text-red-500">
                                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
