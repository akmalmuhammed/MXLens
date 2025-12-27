import { auth } from "@/auth";
import { getIntegrations } from "@/actions/integrations";
import { IntegrationsManager } from "@/components/settings/IntegrationsManager";
import { redirect } from "next/navigation";

export default async function IntegrationsPage() {
    const session = await auth();
    if (!session?.user) redirect("/auth/signin");

    // Fetch existing integrations (server-side)
    const integrations = await getIntegrations();

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Integrations & API Keys</h1>
                <p className="text-muted-foreground">
                    Connect MXLens to your Service Desk (Jira, ServiceNow) or Email Provider (Microsoft 365) to automate incident analysis.
                </p>
            </div>

            <IntegrationsManager initialIntegrations={integrations} />
        </div>
    );
}
