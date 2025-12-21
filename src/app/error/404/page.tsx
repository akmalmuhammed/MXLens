import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Ghost } from "lucide-react";

export default function Error404() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
            <div className="h-32 w-32 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-500 mb-8 animate-pulse">
                <Ghost className="h-16 w-16" />
            </div>
            <h1 className="text-6xl font-extrabold text-foreground mb-4">404</h1>
            <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
            <p className="text-muted-foreground max-w-md mb-8">
                The page you are looking for doesn't exist or has been moved.
            </p>
            <Link href="/">
                <Button className="h-12 px-8">Return to Dashboard</Button>
            </Link>
        </div>
    );
}
