import Link from "next/link";
import { ShieldCheck, Github, Twitter } from "lucide-react";

export function Footer() {
    return (
        // Force dark mode styles regardless of system theme using data-theme="dark" strategy or utility overrides
        <footer className="border-t border-white/10 bg-slate-950 text-slate-200 py-12">
            <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 font-bold text-xl text-white">
                        <ShieldCheck className="h-6 w-6 text-cyan-400" />
                        <span>MXLens</span>
                    </div>
                    <p className="text-sm text-slate-400">
                        Secure, instant email forensics for the modern SOC.
                        <br />
                        Built with privacy as a first principle.
                    </p>
                    <div className="flex gap-4">
                        <Link href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">
                            <Github className="h-5 w-5" />
                        </Link>
                        <Link href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">
                            <Twitter className="h-5 w-5" />
                        </Link>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold mb-4 text-white">Product</h4>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                        <li><Link href="/docs/api" className="hover:text-white transition-colors">API</Link></li>
                        <li><Link href="/status" className="hover:text-white transition-colors">Status</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold mb-4 text-white">Resources</h4>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                        <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                        <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold mb-4 text-white">Legal</h4>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                        <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                        <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
                    </ul>
                </div>
            </div>
            <div className="container mx-auto px-4 mt-12 pt-8 border-t border-white/10 text-center text-sm text-slate-500">
                © 2024-2025 MXLens Security Inc. All rights reserved.
            </div>
        </footer>
    );
}
