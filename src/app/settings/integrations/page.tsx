import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Blocks, MessageSquare, Webhook } from "lucide-react";

export default function IntegrationsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Integrations</h1>
                <p className="text-muted-foreground">Connect MXLens with your security stack.</p>
            </div>

            <div className="grid gap-6">
                {/* Jira Integration */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#0052CC]/10 text-[#0052CC] rounded-lg flex items-center justify-center">
                                <Blocks className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Jira Software</CardTitle>
                                <CardDescription>Automatically create tickets for malicious verdicts.</CardDescription>
                            </div>
                        </div>
                        <Button variant="outline" size="sm">Connect</Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Sync Status: Not Connected</span>
                            <div className="flex items-center gap-2 opacity-50">
                                <Switch disabled />
                                <span>Auto-Create Tickets</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Slack Integration */}
                <Card className="border-green-500/20 bg-green-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#4A154B]/10 text-[#4A154B] rounded-lg flex items-center justify-center">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                    Slack
                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">Connected</Badge>
                                </CardTitle>
                                <CardDescription>Send alerts to #security-alerts channel.</CardDescription>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">Disconnect</Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="font-medium">Active</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch defaultChecked />
                                <span>Alerts Enabled</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Webhooks */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-500/10 text-slate-500 rounded-lg flex items-center justify-center">
                                <Webhook className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Generic Webhooks</CardTitle>
                                <CardDescription>POST JSON payload on analysis completion.</CardDescription>
                            </div>
                        </div>
                        <Button variant="outline" size="sm">Configure</Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>0 active webhooks</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
