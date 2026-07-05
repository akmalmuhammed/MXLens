import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";

export function Navbar() {
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/50 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                    <span className="text-cyan-400">MX</span>Lens
                </Link>

                <div className="flex items-center gap-4">
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

                    <Link href="/analyze">
                        <Button className="bg-cyan-500 text-black hover:bg-cyan-400 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
                            Analyze Free
                        </Button>
                    </Link>
                    <Show when="signed-out">
                        <SignInButton mode="modal">
                            <Button variant="ghost" className="text-slate-300 hover:text-white">
                                Sign In
                            </Button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <Button variant="outline" className="border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400">
                                Sign Up
                            </Button>
                        </SignUpButton>
                    </Show>
                    <Show when="signed-in">
                        <Link href="/dashboard">
                            <Button variant="outline" className="border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400">
                                Dashboard
                            </Button>
                        </Link>
                        <UserButton />
                    </Show>
                </div>
            </div>
        </nav>
    );
}
