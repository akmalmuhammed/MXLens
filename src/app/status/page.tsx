import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, XCircle, Activity, Rss } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StatusPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-16 max-w-4xl">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-extrabold text-white mb-2">System Status</h1>
                        <p className="text-muted-foreground">Live updates on MXLens performance and availability.</p>
                    </div>
                    <Button variant="outline" className="gap-2">
                        <Rss className="w-4 h-4" />
                        Subscribe to Updates
                    </Button>
                </div>

                {/* Overall Status */}
                <Card className="p-6 mb-12 bg-emerald-500/10 border-emerald-500/50 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-emerald-500">All Systems Operational</h2>
                        <p className="text-emerald-500/80 text-sm">Last updated: Just now</p>
                    </div>
                </Card>

                {/* Services List */}
                <div className="space-y-4 mb-12">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Platform Services
                    </h3>

                    <ServiceStatus name="API Gateway" status="operational" />
                    <ServiceStatus name="Analysis Engine" status="operational" />
                    <ServiceStatus name="Dashboard & UI" status="operational" />
                    <ServiceStatus name="Third-party Integrations" status="degraded" />
                    <ServiceStatus name="Billing System" status="operational" />
                </div>

                {/* Uptime */}
                <div className="mb-12">
                    <h3 className="text-lg font-semibold text-white mb-6">Uptime History</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <UptimeCard period="24 hours" percent="99.98%" />
                        <UptimeCard period="7 days" percent="99.95%" />
                        <UptimeCard period="30 days" percent="99.90%" />
                    </div>
                </div>

                {/* Incidents */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-6">Recent Incidents</h3>
                    <div className="border-l-2 border-muted pl-6 space-y-8">
                        <Incident
                            date="Dec 18, 2024"
                            title="Third-party API Latency"
                            status="Resolved"
                            description="We observed increased latency with one of our threat intelligence providers. Traffic was rerouted to redundant providers."
                        />
                        <Incident
                            date="Dec 10, 2024"
                            title="Scheduled Maintenance"
                            status="Completed"
                            description="Planned database upgrades were completed successfully within the maintenance window."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ServiceStatus({ name, status }: { name: string, status: "operational" | "degraded" | "down" }) {
    const config = {
        operational: { color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle2, text: "Operational" },
        degraded: { color: "text-amber-500", bg: "bg-amber-500/10", icon: AlertTriangle, text: "Degraded Performance" },
        down: { color: "text-red-500", bg: "bg-red-500/10", icon: XCircle, text: "Major Outage" },
    };

    const current = config[status];
    const Icon = current.icon;

    return (
        <Card className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <span className="font-medium text-slate-200">{name}</span>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${current.bg} ${current.color} text-sm font-medium`}>
                <Icon className="w-4 h-4" />
                {current.text}
            </div>
        </Card>
    )
}

function UptimeCard({ period, percent }: { period: string, percent: string }) {
    return (
        <Card className="p-6 text-center">
            <h4 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">{period}</h4>
            <p className="text-3xl font-extrabold text-emerald-400">{percent}</p>
        </Card>
    )
}

function Incident({ date, title, status, description }: { date: string, title: string, status: string, description: string }) {
    return (
        <div className="relative">
            <div className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-slate-600 ring-4 ring-background" />
            <div className="mb-2 flex items-center gap-3">
                <span className="text-sm text-slate-500 font-mono">{date}</span>
                <Badge variant="secondary" className="text-xs">{status}</Badge>
            </div>
            <h4 className="text-base font-bold text-slate-200 mb-2">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    )
}
