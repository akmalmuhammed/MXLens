import { UploadCloud, Zap, ShieldCheck, ArrowRight } from "lucide-react";

export function HowItWorks() {
    return (
        <section className="py-24 bg-background">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">How It Works</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        A seamless, secure workflow designed for speed.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Arrows for Desktop */}
                    <div className="hidden md:block absolute top-12 left-[30%] text-primary/30">
                        <ArrowRight className="w-8 h-8" />
                    </div>
                    <div className="hidden md:block absolute top-12 left-[66%] text-primary/30">
                        <ArrowRight className="w-8 h-8" />
                    </div>

                    <Step
                        icon={UploadCloud}
                        title="1. Upload Email"
                        description="Drag & drop any .eml or .msg file directly into the browser. Or paste headers manually."
                    />
                    <Step
                        icon={Zap}
                        title="2. Instant Analysis"
                        description="Our WASM engine parses MIME structures and extracts artifacts in under 3 seconds locally."
                    />
                    <Step
                        icon={ShieldCheck}
                        title="3. Verdict"
                        description="Get an immediate trust score, threat breakdown, and authentication analysis."
                    />
                </div>
            </div>
        </section>
    );
}

function Step({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="flex flex-col items-center text-center p-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <Icon className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    );
}
