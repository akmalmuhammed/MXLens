import { UserCheck, ShieldAlert, Building } from "lucide-react";

export function UseCases() {
    return (
        <section className="py-24 bg-muted/20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Built for Real-World Threats</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <Case
                        icon={UserCheck}
                        title="Executive Impersonation"
                        description="Detect CEO fraud emails with domain similarity checks and header alignment (SPF/DKIM)."
                    />
                    <Case
                        icon={ShieldAlert}
                        title="Credential Harvesting"
                        description="Identify hidden login forms, suspicious redirects, and obscured URLs automatically."
                    />
                    <Case
                        icon={Building}
                        title="Supplier Compromise"
                        description="Verify legitimate vendors vs. spoofed domains using deep header analysis."
                    />
                </div>
            </div>
        </section>
    );
}

function Case({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="flex flex-col items-center text-center p-6 bg-background rounded-2xl border border-border/50 shadow-sm">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-4">
                <Icon className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <p className="text-muted-foreground text-sm">
                {description}
            </p>
        </div>
    );
}
