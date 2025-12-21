import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Shield, EyeOff, ServerOff, FileText } from "lucide-react";

export default function DocumentsPage() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-primary">Privacy & Security Architecture</h1>
                <p className="text-muted-foreground text-lg">
                    A technical deep-dive into how MXLens protects your sensitive data through client-side architecture.
                </p>
            </div>

            {/* Core Privacy Pillars */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-primary/20 bg-card/50">
                    <CardHeader>
                        <Lock className="w-8 h-8 text-primary mb-2" />
                        <CardTitle>Zero Data Retention</CardTitle>
                        <CardDescription>We don't store what we can't see.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        Our backend (Supabase) only stores metadata about *who* performed an analysis (User ID, timestamp) for subscription quotas.
                        The **content** of the emails (Subject, Body, Attachments, Headers) is processed entirely in your browser's memory and is **never** sent to our servers.
                    </CardContent>
                </Card>

                <Card className="border-primary/20 bg-card/50">
                    <CardHeader>
                        <ServerOff className="w-8 h-8 text-primary mb-2" />
                        <CardTitle>Client-Side Processing</CardTitle>
                        <CardDescription>Your browser is the analysis engine.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        MXLens utilizes WebAssembly and JavaScript parsers (PostalMime) to parse MIME structures directly on your device.
                        Threat detection logic runs locally, comparing artifacts against cached logical patterns rather than sending files to a cloud scanner.
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Documentation */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <CardTitle>Technical Implementation Details</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <section>
                        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                            <EyeOff className="w-4 h-4" /> 1. The "Airlock" Pattern
                        </h3>
                        <p className="text-muted-foreground">
                            When you upload an `.eml` or `.msg` file, it remains within a secluded JavaScript `File` object context.
                            Our application reads this into an `ArrayBuffer` locally. No `POST` requests containing file data are ever dispatched to `api.mxlens.com`.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                            <Shield className="w-4 h-4" /> 2. Threat Intelligence
                        </h3>
                        <p className="text-muted-foreground">
                            We use privacy-preserving lookups. Instead of sending full domains to checking services, we verify against local rulesets
                            and only query external reputation APIs (like VirusTotal or Google Safe Browsing) if you *explicitly* enable "Enhanced Cloud Scanning" (Coming Soon),
                            and even then, we use hash-based prefixes where possible.
                        </p>
                    </section>
                </CardContent>
            </Card>

            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 text-sm text-muted-foreground">
                <strong>Legal Note:</strong> This document serves as a transparency report for our "Privacy First" engineering capabilities.
                For full Terms of Service, please contact legal@mxlens.com.
            </div>
        </div>
    );
}
