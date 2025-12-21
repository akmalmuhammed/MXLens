import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Trash2, Plus } from "lucide-react";

export default function ApiKeysPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">API Keys</h1>
                    <p className="text-muted-foreground">Manage keys for programmatic access to the MXLens Analysis Engine.</p>
                </div>
                <Button className="bg-cyan-600 hover:bg-cyan-500">
                    <Plus className="mr-2 h-4 w-4" /> Generate New Key
                </Button>
            </div>

            <div className="bg-yellow-900/10 border border-yellow-500/20 text-yellow-500 p-4 rounded-lg text-sm mb-6">
                <strong>Warning:</strong> Your API keys carry the same privileges as your user account. Do not share them.
            </div>

            <div className="space-y-4">
                {/* Key Item */}
                <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-muted/5">
                    <div>
                        <div className="font-medium flex items-center gap-2">
                            SOAR Integration (Splunk)
                            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold">ACTIVE</span>
                        </div>
                        <div className="text-sm font-mono text-muted-foreground mt-1">
                            sk_live_...4f9a
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">Created 2 days ago</div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm"><Copy className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-muted/5 opacity-60">
                    <div>
                        <div className="font-medium flex items-center gap-2">
                            Legacy Script
                            <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 text-[10px] font-bold">REVOKED</span>
                        </div>
                        <div className="text-sm font-mono text-muted-foreground mt-1">
                            sk_live_...8b2x
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">Revoked on Dec 10, 2024</div>
                    </div>
                    <Button variant="ghost" size="sm" disabled><Trash2 className="h-4 w-4" /></Button>
                </div>
            </div>
        </div>
    );
}
