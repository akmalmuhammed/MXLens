import { PageHeader } from "@/components/marketing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function IntegrationsPage() {
    return (
        <div className="min-h-screen bg-black text-foreground flex flex-col">
            <PageHeader
                title="Integrations"
                description="Connect MXLens with your existing security stack."
            />

            <main className="flex-1 container mx-auto px-4 py-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Slack */}
                <IntegrationCard
                    title="Slack"
                    desc="Push high-priority verdict alerts to a specific channel."
                    status="Connected"
                    icon="/icons/slack.svg" // Placeholder path, using text fallback in component
                />

                {/* Jira */}
                <IntegrationCard
                    title="Jira Service Management"
                    desc="Automatically create tickets when a malicious email is detected."
                    status="Connect"
                    icon="/icons/jira.svg"
                />

                {/* Splunk */}
                <IntegrationCard
                    title="Splunk / SIEM"
                    desc="Forward analysis logs via Webhook or Syslog."
                    status="Connect"
                    icon="/icons/splunk.svg"
                />

                {/* Microsoft Sentinel */}
                <IntegrationCard
                    title="Microsoft Sentinel"
                    desc="Ingest verdict data into Azure Sentinel workspaces."
                    status="Coming Soon"
                    disabled
                />

            </main>
            <Footer />
        </div>
    );
}

function IntegrationCard({ title, desc, status, disabled }: any) {
    return (
        <div className={`p-6 border border-border/50 rounded-xl bg-card flex flex-col h-full ${disabled ? 'opacity-50 grayscale' : ''}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 bg-slate-800 rounded flex items-center justify-center font-bold text-lg">
                    {title[0]}
                </div>
                {status === "Connected" ? (
                    <span className="flex items-center text-green-500 text-xs font-bold gap-1">
                        <CheckCircle2 className="h-3 w-3" /> ACTIVE
                    </span>
                ) : null}
            </div>

            <h3 className="font-bold text-lg mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-6 flex-1">{desc}</p>

            <Button
                variant={status === "Connected" ? "outline" : "default"}
                disabled={disabled}
                className={status === "Connected" ? "border-green-900 text-green-500 bg-green-950/10" : ""}
            >
                {status === "Connected" ? "Configure" : status}
            </Button>
        </div>
    )
}
