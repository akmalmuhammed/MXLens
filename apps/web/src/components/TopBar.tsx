"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const REPO = "https://github.com/akmalmuhammed/mxlens";

function openPalette() {
    window.dispatchEvent(new CustomEvent("mxlens:open-cmdk"));
}

export function TopBar() {
    const pathname = usePathname();
    const [theme, setThemeState] = useState<"dark" | "light">("light");
    const [mac, setMac] = useState(true);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("mxlens-theme") as "dark" | "light" | null;
            if (stored) setThemeState(stored);
        } catch { /* storage blocked */ }
        setMac(/Mac|iPhone|iPad/.test(navigator.platform) || /Mac/.test(navigator.userAgent));
    }, []);

    function toggle() {
        const next = theme === "dark" ? "light" : "dark";
        setThemeState(next);
        document.documentElement.setAttribute("data-theme", next);
        try { localStorage.setItem("mxlens-theme", next); } catch { /* ignore */ }
    }

    const is = (p: string) => (p === "/" ? pathname === "/" : pathname.startsWith(p));

    return (
        <header className="topbar">
            <div className="wrap topbar-inner">
                <Link href="/" className="brand">
                    <Logo className="mark" />
                    MXLens <span className="ver">v1</span>
                </Link>
                <nav className="topnav">
                    <Link href="/" className={is("/") ? "active" : ""}>Analyze</Link>
                    <Link href="/dashboard" className={is("/dashboard") ? "active" : ""}>Dashboard</Link>
                    <Link href="/docs" className={is("/docs") ? "active" : ""}>Docs</Link>
                    <a href={REPO} target="_blank" rel="noopener noreferrer">GitHub</a>
                </nav>
                <button className="cmdk-btn" onClick={openPalette} aria-label="Open command palette">
                    <span>Search</span>
                    <kbd>{mac ? "⌘" : "Ctrl"} K</kbd>
                </button>
                <button className="iconbtn" onClick={toggle} aria-label="Toggle light and dark theme" title="Toggle theme">
                    {theme === "dark" ? "☾" : "☀"}
                </button>
            </div>
        </header>
    );
}
