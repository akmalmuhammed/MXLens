import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";

export function Navbar() {
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/50 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-3 sm:px-4">
                <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight sm:text-xl">
                    <span className="text-cyan-400">MX</span>Lens
                </Link>

                <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3 md:gap-4">
                    <Link href="/features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden md:block">
                        Features
                    </Link>
                    <Link href="/resources/api-docs" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden md:block">
                        API
                    </Link>
                    <Link href="/trust-center" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden lg:block">
                        Trust
                    </Link>

                    <ModeToggle />

                    <Button asChild className="h-9 px-2 text-xs font-semibold bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all hover:bg-cyan-400 sm:h-10 sm:px-4 sm:text-sm max-[359px]:hidden">
                        <Link href="/analyze">Analyze Free</Link>
                    </Button>
                    <Show when="signed-out">
                        <SignInButton mode="modal">
                            <Button variant="ghost" className="h-9 px-2 text-xs text-slate-300 hover:text-white sm:h-10 sm:px-4 sm:text-sm">
                                Sign In
                            </Button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <Button variant="outline" className="hidden h-10 border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400 sm:inline-flex">
                                Sign Up
                            </Button>
                        </SignUpButton>
                    </Show>
                    <Show when="signed-in">
                        <Button asChild variant="outline" className="h-9 px-2 text-xs border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400 sm:h-10 sm:px-4 sm:text-sm">
                            <Link href="/dashboard">Dashboard</Link>
                        </Button>
                        <UserButton />
                    </Show>
                </div>
            </div>
        </nav>
    );
}
