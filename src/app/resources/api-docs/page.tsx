import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Key, Terminal, UploadCloud } from "lucide-react";

export default function ApiDocsPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-16 space-y-10">
                <div className="max-w-3xl space-y-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-900/30 text-cyan-400 text-sm font-medium">
                        <Terminal className="w-4 h-4" />
                        Developer API v1
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white">
                        MXLens for agents and automations
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Upload email files, fetch signed URLs, create bulk batches, and retrieve privacy-safe analysis results through REST or MCP.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Button asChild className="h-11 px-6">
                            <Link href="/settings/api-keys">Manage API Keys</Link>
                        </Button>
                        <Button asChild variant="outline" className="h-11 px-6">
                            <Link href="/api/v1/openapi.json">OpenAPI JSON</Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UploadCloud className="h-5 w-5 text-cyan-400" />
                                Analyze One Email
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CodeBlock>{`curl -X POST https://mxlens.com/api/v1/analyze \\
  -H "Authorization: Bearer mxl_live_..." \\
  -F "file=@suspicious.eml" \\
  -F "analyzeBody=true"`}</CodeBlock>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5 text-emerald-400" />
                                Safe URL Fetch
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CodeBlock>{`curl -X POST https://mxlens.com/api/v1/analyze \\
  -H "Authorization: Bearer mxl_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"fetchUrl":"https://storage.example.com/email.eml?signature=..."}'`}</CodeBlock>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Terminal className="h-5 w-5 text-purple-400" />
                                Bulk Batch
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CodeBlock>{`curl -X POST https://mxlens.com/api/v1/batches \\
  -H "Authorization: Bearer mxl_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"items":[{"contentBase64":"..."}]}'`}
                            </CodeBlock>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Code className="h-5 w-5 text-amber-400" />
                                MCP Endpoint
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CodeBlock>{`POST /api/mcp
Authorization: Bearer mxl_live_...

Tools:
- mxlens_analyze_email
- mxlens_create_batch
- mxlens_get_batch
- mxlens_get_analysis`}</CodeBlock>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function CodeBlock({ children }: { children: string }) {
    return (
        <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-200">
            <code>{children}</code>
        </pre>
    );
}
