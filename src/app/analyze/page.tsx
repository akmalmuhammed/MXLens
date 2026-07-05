import { EmailAnalyzer } from "@/components/email/EmailAnalyzer";

export default async function AnalyzePage() {
    return (
        <div className="container mx-auto py-2 min-h-screen space-y-3">
            <h1 className="text-xl font-bold tracking-tight text-foreground font-heading bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Email Analysis Studio
            </h1>

            <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl relative overflow-hidden min-h-[700px] transition-all">
                {/* Decorative gradients */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
                <div className="relative z-10 h-full p-1">
                    <EmailAnalyzer userPlan="FREE" />
                </div>
            </div>

            <p className="text-center text-sm text-muted-foreground/60">
                Your file never leaves this browser tab. All parsing happens locally in WebAssembly.
            </p>
        </div>
    );
}
