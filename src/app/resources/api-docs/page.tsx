import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Code, Terminal, Key } from "lucide-react";

export default function ApiDocsPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="py-20 container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-900/30 text-cyan-400 text-sm font-medium mb-6">
                        <Terminal className="w-4 h-4" />
                        Developer API v1
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                        Build powerful security tools with <span className="text-cyan-400">MXLens API</span>
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8">
                        Programmatic access to our scanning engine, threat intelligence, and analysis results.
                    </p>
                    <div className="flex gap-4">
                        <Button className="h-12 px-8">Get API Keys</Button>
                        <Button variant="outline" className="h-12 px-8">Read Full Reference</Button>
                    </div>
                </div>
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 font-mono text-sm relative shadow-2xl">
                    <div className="flex gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    </div>
                    <div className="text-slate-400">
                        <span className="text-purple-400">curl</span> -X POST \<br />
                        &nbsp;&nbsp;https://api.mxlens.com/v1/analyze \<br />
                        &nbsp;&nbsp;-H <span className="text-emerald-400">"Authorization: Bearer mxl_..."</span> \<br />
                        &nbsp;&nbsp;-F <span className="text-amber-400">"file=@suspicious.eml"</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-800 text-emerald-400">
                        &#123;<br />
                        &nbsp;&nbsp;"id": "anl_8f92a...",<br />
                        &nbsp;&nbsp;"verdict": "malicious",<br />
                        &nbsp;&nbsp;"score": 98<br />
                        &#125;
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 pb-20 grid md:grid-cols-3 gap-6">
                <Card className="p-6">
                    <Key className="w-8 h-8 text-cyan-400 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Authentication</h3>
                    <p className="text-slate-400">Learn how to generate and manage API keys for your application.</p>
                </Card>
                <Card className="p-6">
                    <Code className="w-8 h-8 text-purple-400 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">SDKs & Libraries</h3>
                    <p className="text-slate-400">Official clients for Python, Node.js, and Go to get you started faster.</p>
                </Card>
                <Card className="p-6">
                    <Terminal className="w-8 h-8 text-emerald-400 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Rate Limits</h3>
                    <p className="text-slate-400">Understanding fair usage policies and quota tiers.</p>
                </Card>
            </div>
        </div>
    );
}
