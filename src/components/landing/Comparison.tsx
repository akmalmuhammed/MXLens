import { Check, X, ShieldCheck } from "lucide-react";

export function Comparison() {
    return (
        <section className="py-24 bg-background">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Why Security Teams Choose MXLens</h2>
                    <p className="text-muted-foreground">Stop compromising between speed and privacy.</p>
                </div>

                <div className="max-w-4xl mx-auto overflow-hidden rounded-xl border border-border/50">
                    <div className="grid grid-cols-4 bg-muted/50 p-4 font-bold text-sm md:text-base border-b border-border/50">
                        <div className="col-span-1"></div>
                        <div className="col-span-1 text-center text-muted-foreground">MXToolbox</div>
                        <div className="col-span-1 text-center text-muted-foreground">VirusTotal</div>
                        <div className="col-span-1 text-center text-primary flex items-center justify-center gap-2">
                            <ShieldCheck className="w-5 h-5" /> MXLens
                        </div>
                    </div>

                    <Row
                        feature="Privacy"
                        competitor1="Risk (Public Logs)"
                        competitor2="Risk (Public Upload)"
                        us="100% Private (Local)"
                        highlight
                    />
                    <Row
                        feature="Analysis Depth"
                        competitor1="Basic DNS"
                        competitor2="File Reputation"
                        us="Full Email Forensics"
                        highlight
                    />
                    <Row
                        feature="Body Parsing"
                        competitor1={<X className="h-5 w-5 text-muted-foreground mx-auto" />}
                        competitor2={<X className="h-5 w-5 text-muted-foreground mx-auto" />}
                        us={<Check className="h-5 w-5 text-primary mx-auto" />}
                        highlight
                    />
                    <Row
                        feature="Speed"
                        competitor1="Fast"
                        competitor2="Medium"
                        us="Instant (<3s)"
                        highlight
                    />
                </div>
            </div>
        </section>
    );
}

function Row({ feature, competitor1, competitor2, us, highlight }: any) {
    return (
        <div className="grid grid-cols-4 p-4 border-b border-border/50 last:border-0 hover:bg-muted/10 items-center">
            <div className="col-span-1 font-medium text-sm md:text-base">{feature}</div>
            <div className="col-span-1 text-center text-sm text-muted-foreground">{competitor1}</div>
            <div className="col-span-1 text-center text-sm text-muted-foreground">{competitor2}</div>
            <div className={`col-span-1 text-center text-sm font-bold ${highlight ? "text-foreground" : ""}`}>
                {us}
            </div>
        </div>
    );
}
