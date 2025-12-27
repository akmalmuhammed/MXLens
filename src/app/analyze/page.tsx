import { EmailAnalyzer } from "@/components/email/EmailAnalyzer";
import { ShieldCheck, EyeOff, Cpu } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AnalyzePage() {
    const session = await auth();
    let planTier = "FREE";

    if (session?.user?.orgId) {
        const org = await db.organization.findUnique({
            where: { id: session.user.orgId },
            select: { planTier: true }
        });
        if (org) planTier = org.planTier;
    }

    return (
        <div className="container mx-auto py-8 min-h-screen space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl font-heading bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        Email Analysis Studio
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Advanced forensic analysis with local-only privacy.
                    </p>
                </div>

                {/* Privacy Trust Badge */}
                <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground bg-background/60 backdrop-blur-md px-4 py-2 rounded-full border shadow-sm">
                    <span className="flex items-center gap-1.5"><EyeOff className="w-3.5 h-3.5 text-primary" /> Private Session</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-primary" /> Client-Side Processing</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary" /> SOC-2 Logic</span>
                </div>
            </div>

            <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl relative overflow-hidden min-h-[700px] transition-all">
                {/* Decorative gradients */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
                <div className="relative z-10 h-full p-1">
                    <EmailAnalyzer userPlan={planTier} />
                </div>
            </div>

            <p className="text-center text-sm text-muted-foreground/60">
                Your file never leaves this browser tab. All parsing happens locally in WebAssembly.
            </p>
        </div>
    );
}
