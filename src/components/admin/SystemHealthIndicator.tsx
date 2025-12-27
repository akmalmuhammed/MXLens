import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, XCircle, Clock } from "lucide-react";

interface Service {
    name: string;
    status: "operational" | "degraded" | "down" | "maintenance";
    latency?: string;
}

const services: Service[] = [
    { name: "API Server", status: "operational", latency: "45ms" },
    { name: "Database", status: "operational", latency: "12ms" },
    { name: "Detection Engine", status: "operational", latency: "156ms" },
    { name: "Cache (Redis)", status: "degraded", latency: "89ms" },
    { name: "File Storage", status: "operational", latency: "23ms" },
    { name: "Email Service", status: "operational" },
];

const getStatusIcon = (status: Service["status"]) => {
    switch (status) {
        case "operational":
            return CheckCircle2;
        case "degraded":
            return AlertCircle;
        case "down":
            return XCircle;
        case "maintenance":
            return Clock;
    }
};

const getStatusColor = (status: Service["status"]) => {
    switch (status) {
        case "operational":
            return "text-secure";
        case "degraded":
            return "text-warning";
        case "down":
            return "text-destructive";
        case "maintenance":
            return "text-muted-foreground";
    }
};

const getStatusLabel = (status: Service["status"]) => {
    switch (status) {
        case "operational":
            return "Operational";
        case "degraded":
            return "Degraded";
        case "down":
            return "Down";
        case "maintenance":
            return "Maintenance";
    }
};

export function SystemHealthIndicator() {
    const allOperational = services.every((s) => s.status === "operational");
    const hasIssues = services.some((s) => s.status === "degraded" || s.status === "down");

    return (
        <div className="rounded-lg border border-border bg-card">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="font-semibold">System Health</h3>
                <div
                    className={cn(
                        "flex items-center gap-2 text-xs font-mono px-2 py-1 rounded",
                        allOperational
                            ? "bg-secure/20 text-secure"
                            : hasIssues
                                ? "bg-warning/20 text-warning"
                                : "bg-destructive/20 text-destructive"
                    )}
                >
                    {allOperational ? (
                        <>
                            <span className="h-2 w-2 rounded-full bg-secure pulse-live" />
                            ALL SYSTEMS GO
                        </>
                    ) : (
                        <>
                            <span className="h-2 w-2 rounded-full bg-warning pulse-live" />
                            ISSUES DETECTED
                        </>
                    )}
                </div>
            </div>

            {/* Services Grid */}
            <div className="p-4 grid gap-2">
                {services.map((service) => {
                    const Icon = getStatusIcon(service.status);
                    return (
                        <div
                            key={service.name}
                            className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Icon className={cn("h-4 w-4", getStatusColor(service.status))} />
                                <span className="text-sm font-medium">{service.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {service.latency && (
                                    <span className="text-xs font-mono text-muted-foreground">
                                        {service.latency}
                                    </span>
                                )}
                                <span
                                    className={cn(
                                        "text-xs font-medium",
                                        getStatusColor(service.status)
                                    )}
                                >
                                    {getStatusLabel(service.status)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="border-t border-border p-3">
                <button className="text-sm text-primary hover:underline w-full text-center">
                    View detailed status
                </button>
            </div>
        </div>
    );
}
