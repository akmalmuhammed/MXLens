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
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
            <div className="h-24 w-24 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6">
                <AlertTriangle className="h-12 w-12" />
            </div>
            <h2 className="text-4xl font-bold mb-4">Analysis Interrupted</h2>
            <p className="text-xl text-muted-foreground max-w-md mb-8">
                Something went wrong on our end. Our heat-seeking missile team has been dispatched to fix it.
            </p>

            <div className="flex gap-4">
                <Button onClick={() => reset()} variant="outline">
                    Try Again
                </Button>
                <Link href="/">
                    <Button>Return Home</Button>
                </Link>
            </div>

            {error.digest && (
                <p className="mt-8 text-xs text-muted-foreground font-mono">Error ID: {error.digest}</p>
            )}
        </div>
    );
}
