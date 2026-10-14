"use client";

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { AlertCircle, Copy, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        // Log to Sentry
        console.error("[Admin Error Boundary]", error);
        Sentry.captureException(error);
    }, [error]);

    const copyError = () => {
        const text = `Error: ${error.message}\nDigest: ${error.digest || 'N/A'}\nStack: ${error.stack}`;
        navigator.clipboard.writeText(text);
        toast.success("Error details copied to clipboard");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="max-w-xl w-full space-y-8">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
                    <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
                    <p className="text-muted-foreground mb-6">
                        An unexpected error occurred in the admin panel.
                        This has been reported to our engineering team.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button onClick={() => reset()} className="gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </Button>
                        <Link href="/admin">
                            <Button variant="outline" className="gap-2 w-full sm:w-auto">
                                <Home className="w-4 h-4" />
                                Return to Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="border rounded-lg overflow-hidden bg-card">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="w-full px-4 py-3 text-left text-sm font-medium flex items-center justify-between hover:bg-muted/50 transition-colors"
                    >
                        <span>Technical Details</span>
                        <span className="text-xs text-muted-foreground">
                            {showDetails ? "Hide" : "Show"}
                        </span>
                    </button>

                    {showDetails && (
                        <div className="p-4 bg-muted/30 border-t space-y-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1 overflow-hidden">
                                    <p className="text-xs font-mono font-bold text-destructive truncate">
                                        {error.message}
                                    </p>
                                    {error.digest && (
                                        <p className="text-xs text-muted-foreground font-mono">
                                            Digest: {error.digest}
                                        </p>
                                    )}
                                </div>
                                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={copyError}>
                                    <Copy className="w-3.5 h-3.5" />
                                </Button>
                            </div>

                            <div className="bg-muted p-3 rounded text-xs font-mono overflow-auto max-h-[300px] whitespace-pre-wrap">
                                {error.stack || "No stack trace available"}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
