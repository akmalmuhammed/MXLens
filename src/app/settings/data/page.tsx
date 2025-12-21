import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Trash2, History } from "lucide-react";

export default function DataPrivacyPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Data & Privacy</h1>
                <p className="text-muted-foreground">Manage your data retention and account deletion.</p>
            </div>

            <div className="space-y-6">
                <Card className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                            <Download className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold mb-1">Export Data</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Download a copy of your personal data, including analysis history and account details, in JSON format.
                            </p>
                            <Button variant="outline">Request Archive</Button>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                            <History className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold mb-1">Retention Policy</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                                You are currently on the <span className="font-medium text-foreground">Free Plan</span>.
                            </p>
                            <ul className="text-xs text-muted-foreground space-y-1 mb-4 list-disc pl-4">
                                <li>Analysis Metadata: Retained for 30 days</li>
                                <li>Raw Email Headers: Deleted after 24 hours</li>
                                <li>Uploaded Files: Never stored to disk</li>
                            </ul>
                            <Button variant="link" className="px-0">View Privacy Policy</Button>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-red-500/20 bg-red-500/5">
                    <div className="flex items-start gap-4">
                        <div className="bg-red-500/10 p-3 rounded-lg">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold mb-1 text-red-600 dark:text-red-400">Delete Account</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Permanently remove your account and all associated data. This action cannot be undone.
                            </p>
                            <Button variant="destructive">Delete Account</Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
