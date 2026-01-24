"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logger } from "@/lib/logger";
import { useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, Bug, CheckCircle, Info } from "lucide-react";
import { toast } from "sonner";

export default function DebugPage() {
    const [lastLog, setLastLog] = useState<string | null>(null);

    const testInfo = () => {
        Logger.info("Test Info Log", { userAction: "clicked_test_info", timestamp: new Date().toISOString() });
        setLastLog("Info log triggered");
        toast.success("Info log sent to console (Prod: Breadcrumb)");
    };

    const testWarn = () => {
        Logger.warn("Test Warning Log", { potentialIssue: "testing_warning" });
        setLastLog("Warning log triggered");
        toast.warning("Warning log sent (Prod: captured message)");
    };

    const testError = () => {
        const fakeError = new Error("Manual Test Error from Debug Dashboard");
        Logger.error("Test Error Log", fakeError, { severity: "test" });
        setLastLog("Error log triggered");
        toast.error("Error log sent (Prod: captured exception)");
    };

    const throwUnhandled = () => {
        // This will be caught by the Error Boundary
        throw new Error("This is an unhandled exception triggered for testing!");
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Debug</h1>
                    <p className="text-muted-foreground">Internal tools for verifying error tracking and logging.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="w-5 h-5 text-blue-500" />
                            Environment
                        </CardTitle>
                        <CardDescription>Current runtime configuration</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="font-medium text-muted-foreground">NODE_ENV:</div>
                            <div className="font-mono bg-muted px-2 py-0.5 rounded w-fit">
                                {process.env.NODE_ENV}
                            </div>

                            <div className="font-medium text-muted-foreground">Sentry Enabled:</div>
                            <div className="flex items-center gap-2">
                                {process.env.NEXT_PUBLIC_SENTRY_DSN ? (
                                    <span className="flex items-center gap-1.5 text-green-500 font-medium">
                                        <CheckCircle className="w-3.5 h-3.5" /> Yes
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-red-500 font-medium">
                                        <AlertTriangle className="w-3.5 h-3.5" /> No (DSN Missing)
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bug className="w-5 h-5 text-orange-500" />
                            Log Controls
                        </CardTitle>
                        <CardDescription>Trigger log events to verify capture</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Button variant="outline" onClick={testInfo} className="w-full border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-blue-800 dark:hover:bg-blue-950/30">
                                Log Info
                            </Button>
                            <Button variant="outline" onClick={testWarn} className="w-full border-amber-200 hover:bg-amber-50 hover:text-amber-600 dark:border-amber-800 dark:hover:bg-amber-950/30">
                                Log Warn
                            </Button>
                            <Button variant="outline" onClick={testError} className="w-full border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-950/30">
                                Log Error
                            </Button>
                        </div>

                        <div className="pt-2 border-t">
                            <Button variant="destructive" onClick={throwUnhandled} className="w-full">
                                Trigger Unhandled Crash
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                                This will crash the page and trigger the Error Boundary.
                            </p>
                        </div>

                        {lastLog && (
                            <div className="bg-muted p-2 rounded text-xs font-mono text-center">
                                Last Action: {lastLog}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
