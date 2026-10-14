import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PreferencesPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Preferences</h1>
                <p className="text-muted-foreground">Customize your analysis workflow and interface.</p>
            </div>

            <div className="space-y-6">
                <div className="grid gap-4 p-4 border rounded-lg bg-card">
                    <h3 className="font-semibold text-lg">General</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Timezone</Label>
                            <Select defaultValue="utc">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="utc">UTC (Coordinated Universal Time)</SelectItem>
                                    <SelectItem value="est">EST (Eastern Standard Time)</SelectItem>
                                    <SelectItem value="pst">PST (Pacific Standard Time)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Date Format</Label>
                            <Select defaultValue="iso">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select format" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="iso">YYYY-MM-DD</SelectItem>
                                    <SelectItem value="us">MM/DD/YYYY</SelectItem>
                                    <SelectItem value="eu">DD/MM/YYYY</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 p-4 border rounded-lg bg-card">
                    <h3 className="font-semibold text-lg">Analysis Defaults</h3>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Auto-Expand Headers</Label>
                            <p className="text-sm text-muted-foreground">Always show full email headers in analysis results.</p>
                        </div>
                        <Switch />
                    </div>
                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="space-y-0.5">
                            <Label>Colorblind Mode</Label>
                            <p className="text-sm text-muted-foreground">Use high-contrast patterns for verdicts.</p>
                        </div>
                        <Switch />
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <Button>Save Preferences</Button>
            </div>
        </div>
    );
}
