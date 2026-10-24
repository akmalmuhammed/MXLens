"use client";

import { Shield, Github } from "lucide-react";
import Link from "next/link";
import { GITHUB_URL, ISSUES_URL, LICENSE_URL, SECURITY_POLICY_URL, SELF_HOSTING_URL } from "@/lib/site";

const footerLinks = {
    Project: [
        { label: "Analyze an email", href: "/analyze" },
        { label: "Source code", href: GITHUB_URL },
        { label: "Self-hosting", href: SELF_HOSTING_URL },
    ],
    Learn: [
        { label: "Phishing 101", href: "/learn/phishing-101" },
        { label: "Report an issue", href: ISSUES_URL },
    ],
    Legal: [
        { label: "Privacy", href: "/privacy" },
        { label: "License (MIT)", href: LICENSE_URL },
        { label: "Security policy", href: SECURITY_POLICY_URL },
    ],
};

const socialLinks = [
    { icon: Github, href: GITHUB_URL, label: "GitHub" },
];

export const Footer = () => {
    return (
        <footer className="border-t border-border bg-card/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    {/* Logo column */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <Shield className="h-7 w-7 text-primary" />
                            <span className="font-bold text-lg">
                                <span className="text-primary">MX</span>
                                <span className="text-foreground">Lens</span>
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-4">
                            Free, open-source email
                            <br />
                            phishing analysis.
                        </p>
                        <div className="flex items-center gap-3">
                            {socialLinks.map((social, i) => (
                                <a
                                    key={i}
                                    href={social.href}
                                    aria-label={social.label}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                >
                                    <social.icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">{title}</h4>
                            <ul className="space-y-3">
                                {links.map((link, i) => (
                                    <li key={i}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} MXLens contributors. Released under the MIT License.
                    </p>
                    <p className="text-xs font-mono text-muted-foreground/70">
                        Your emails are analyzed in your browser.
                    </p>
                </div>
            </div>
        </footer>
    );
};
