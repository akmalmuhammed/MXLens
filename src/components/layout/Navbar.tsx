import Link from "next/link";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { GITHUB_URL } from "@/lib/site";

export function Navbar() {
    return (
        <nav className="no-print sticky top-0 z-50 w-full border-b border-hairline bg-background/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-3 sm:px-4">
                <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight sm:text-xl">
                    <span className="text-sev-info">MX</span>Lens
                </Link>

                <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3 md:gap-4">
                    <Link href="/learn/phishing-101" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block">
                        Learn
                    </Link>
                    <a
                        href={GITHUB_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Github className="h-4 w-4" />
                        <span className="hidden sm:inline">GitHub</span>
                    </a>

                    <ModeToggle />

                    <Button asChild className="h-9 px-3 text-xs font-semibold bg-sev-info text-background transition-colors hover:bg-sev-info/90 sm:px-4 sm:text-sm">
                        <Link href="/analyze">Analyze</Link>
                    </Button>
                </div>
            </div>
        </nav>
    );
}
