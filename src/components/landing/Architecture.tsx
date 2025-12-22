import { ShieldCheck, Server, Globe, Lock, ArrowRight, XCircle, CheckCircle } from "lucide-react";

export function Architecture() {
    return (
        <section className="py-24 bg-muted/10 border-y border-border/50 relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            ></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <h2 className="section-headline">Architecturally Private</h2>
                    <p className="body-text text-muted-foreground">
                        We don't promise privacy. We guarantee it with physics.
                        Your data cannot leak because it never leaves your device.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* The Old Way */}
                    <div className="opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500 rounded-2xl border border-destructive/20 bg-destructive/5 p-8 relative group">
                        <div className="absolute top-4 right-4 text-destructive text-xs font-bold uppercase tracking-widest border border-destructive/30 px-2 py-1 rounded">
                            The Industry Standard
                        </div>
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-destructive">
                            <XCircle className="w-6 h-6" /> Cloud-Based Analysis
                        </h3>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="w-8 h-8 rounded bg-background border flex items-center justify-center shrink-0">
                                    You
                                </span>
                                <ArrowRight className="w-5 h-5 animate-pulse text-destructive" />
                                <div className="flex-1 p-3 rounded bg-background border border-border dashed border-destructive/30 flex items-center gap-2">
                                    <Server className="w-4 h-4" />
                                    <span>Cloud Server (Logs, Storage)</span>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground/80 leading-relaxed border-l-2 border-destructive/30 pl-4">
                                ⚠️ Sensitive emails are uploaded to a 3rd party server.
                                Risks include data breaches, insider threats, and subpoena access.
                            </p>
                        </div>
                    </div>

                    {/* The MXLens Way */}
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 relative shadow-2xl shadow-primary/10 ring-1 ring-primary/20">
                        <div className="absolute top-4 right-4 text-primary text-xs font-bold uppercase tracking-widest border border-primary/30 px-2 py-1 rounded bg-primary/10">
                            The MXLens Architecture
                        </div>
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary">
                            <CheckCircle className="w-6 h-6" /> Local Execution
                        </h3>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4 text-sm text-foreground">
                                <span className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                                    You
                                </span>
                                <div className="h-px bg-primary w-8 relative">
                                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full animate-ping opacity-20"></div>
                                </div>
                                <div className="flex-1 p-3 rounded bg-card border border-primary/30 flex items-center gap-3 shadow-sm">
                                    <Lock className="w-4 h-4 text-primary" />
                                    <span className="font-semibold">Browser Memory (WASM)</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground opacity-50">
                                <div className="w-8 h-8"></div>
                                <div className="h-px bg-border w-8 relative flex items-center justify-center">
                                    <XCircle className="w-3 h-3 text-muted-foreground bg-background z-10" />
                                </div>
                                <div className="flex-1 p-3 rounded border border-dashed border-border flex items-center gap-2 grayscale">
                                    <Globe className="w-4 h-4" />
                                    <span>External Internet</span>
                                </div>
                            </div>

                            <p className="text-xs text-primary/80 leading-relaxed border-l-2 border-primary/50 pl-4 font-medium">
                                ✅ Analysis happens instantly in your RAM.
                                No bytes leave your machine. The network is completely bypassed.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
