import Link from "next/link";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { GITHUB_URL } from "@/lib/site";

export function Navbar() {
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/50 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-3 sm:px-4">
                <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight sm:text-xl">
                    <span className="text-cyan-400">MX</span>Lens
                </Link>

                <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3 md:gap-4">
                    <Link href="/learn/phishing-101" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden md:block">
                        Learn
                    </Link>
                    <a
                        href={GITHUB_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        <Github className="h-4 w-4" />
                        <span className="hidden sm:inline">GitHub</span>
                    </a>

                    <ModeToggle />

                    <Button asChild className="h-9 px-2 text-xs font-semibold bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all hover:bg-cyan-400 sm:h-10 sm:px-4 sm:text-sm">
                        <Link href="/analyze">Analyze</Link>
                    </Button>
                </div>
            </div>
        </nav>
    );
}
