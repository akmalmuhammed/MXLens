import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Notifications</h1>
                <p className="text-muted-foreground">Manage how and when we communicate with you.</p>
            </div>

            <div className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Security Alerts</h3>
                    <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5">
                            <Label>Malicious Verdict Detected</Label>
                            <p className="text-sm text-muted-foreground">Email me immediately when a high-risk threat is analyzed.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5">
                            <Label>Quota Warning</Label>
                            <p className="text-sm text-muted-foreground">Notify me when I reach 80% of my plan limit.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </div>

                <div className="space-y-4 pt-6 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Product Updates</h3>
                    <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5">
                            <Label>Weekly Summary</Label>
                            <p className="text-sm text-muted-foreground">A digest of your activity and recovered threat stats.</p>
                        </div>
                        <Switch />
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5">
                            <Label>Marketing & Offers</Label>
                            <p className="text-sm text-muted-foreground">News about new features and promotions.</p>
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
