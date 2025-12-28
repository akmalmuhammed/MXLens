"use client"; // Error components must be Client Components

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("[MXLENS_DEBUG] [ERROR_PAGE] Error caught:", error);
        console.error("[MXLENS_DEBUG] [ERROR_PAGE] Error message:", error.message);
        console.error("[MXLENS_DEBUG] [ERROR_PAGE] Error stack:", error.stack);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
            <div className="h-24 w-24 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6">
                <AlertTriangle className="h-12 w-12" />
            </div>
            <h2 className="text-4xl font-bold mb-4">Analysis Interrupted</h2>
            <p className="text-xl text-muted-foreground max-w-md mb-4">
                Something went wrong on our end. Our heat-seeking missile team has been dispatched to fix it.
            </p>

            {/* Show error details for debugging */}
            <div className="max-w-lg mb-8 text-left">
                <details className="bg-muted/50 border border-border rounded-lg p-4">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                        Technical Details (click to expand)
                    </summary>
                    <div className="mt-4 space-y-2">
                        <p className="text-xs font-mono text-destructive break-all">
                            <strong>Error:</strong> {error.message}
                        </p>
                        {error.digest && (
                            <p className="text-xs font-mono text-muted-foreground">
                                <strong>Digest:</strong> {error.digest}
                            </p>
                        )}
                        <p className="text-xs font-mono text-muted-foreground break-all whitespace-pre-wrap">
                            <strong>Stack:</strong> {error.stack?.slice(0, 500)}...
                        </p>
                    </div>
                </details>
            </div>

            <div className="flex gap-4">
                <Button onClick={() => reset()} variant="outline">
                    Try Again
                </Button>
                <Link href="/">
                    <Button>Return Home</Button>
                </Link>
            </div>
        </div>
    );
}

