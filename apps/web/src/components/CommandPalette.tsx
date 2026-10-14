"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadHistory, clearHistory, type HistoryRecord } from "@/lib/history";

interface Command {
    id: string;
    label: string;
    group: string;
    icon: string;
    hint?: string;
    keywords?: string;
    run: () => void;
}

function setTheme(next: "dark" | "light") {
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("mxlens-theme", next); } catch { /* ignore */ }
}

export function CommandPalette() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const [recent, setRecent] = useState<HistoryRecord[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const close = useCallback(() => { setOpen(false); setQuery(""); setActive(0); }, []);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen((v) => !v);
            } else if (e.key === "Escape") {
                setOpen(false);
            }
        }
        const openEvt = () => setOpen(true);
        window.addEventListener("keydown", onKey);
        window.addEventListener("mxlens:open-cmdk", openEvt);
        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("mxlens:open-cmdk", openEvt);
        };
    }, []);

    useEffect(() => {
        if (open) {
            setRecent(loadHistory().slice(0, 6));
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [open]);

    const go = useCallback((path: string) => { router.push(path); close(); }, [router, close]);

    const commands = useMemo<Command[]>(() => {
        const base: Command[] = [
            { id: "nav-analyze", label: "Analyze an email", group: "Go to", icon: "◎", hint: "G A", keywords: "home scan inspect", run: () => go("/") },
            { id: "nav-dash", label: "Dashboard", group: "Go to", icon: "▦", hint: "G D", keywords: "history session threats overview", run: () => go("/dashboard") },
            { id: "nav-docs", label: "Documentation", group: "Go to", icon: "❯", keywords: "cli api mcp rules help", run: () => go("/docs") },
            { id: "nav-about", label: "About", group: "Go to", icon: "ⓘ", keywords: "privacy how it works", run: () => go("/about") },
            { id: "act-phish", label: "Try the phishing sample", group: "Actions", icon: "⚑", keywords: "demo example test", run: () => go("/?sample=demo-phishing.eml") },
            { id: "act-legit", label: "Try the legitimate sample", group: "Actions", icon: "✓", keywords: "demo example test clean", run: () => go("/?sample=demo-legitimate.eml") },
            { id: "act-dark", label: "Switch to dark theme", group: "Actions", icon: "☾", run: () => { setTheme("dark"); close(); } },
            { id: "act-light", label: "Switch to light theme", group: "Actions", icon: "☀", run: () => { setTheme("light"); close(); } },
            { id: "act-clear", label: "Clear session history", group: "Actions", icon: "⌫", keywords: "delete reset wipe", run: () => { clearHistory(); close(); } },
        ];
        const recents: Command[] = recent.map((r) => ({
            id: `rec-${r.id}`,
            label: r.subject || r.fromAddress || "(no subject)",
            group: "Recent analyses",
            icon: r.verdict === "malicious" ? "●" : r.verdict === "suspicious" ? "◐" : "○",
            hint: String(r.riskScore),
            keywords: `${r.fromDomain ?? ""} ${r.verdictLabel}`,
            run: () => go(`/?open=${r.id}`),
        }));
        return [...base, ...recents];
    }, [go, close, recent]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return commands;
        return commands.filter((c) => (`${c.label} ${c.group} ${c.keywords ?? ""}`).toLowerCase().includes(q));
    }, [commands, query]);

    useEffect(() => { setActive(0); }, [query]);

    const grouped = useMemo(() => {
        const map = new Map<string, Command[]>();
        for (const c of filtered) { const g = map.get(c.group) ?? []; g.push(c); map.set(c.group, g); }
        return [...map.entries()];
    }, [filtered]);

    function onInputKey(e: React.KeyboardEvent) {
        if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
        else if (e.key === "Enter") { e.preventDefault(); filtered[active]?.run(); }
    }

    useEffect(() => {
        listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
    }, [active]);

    if (!open) return null;

    let flatIndex = -1;
    return (
        <div className="cmdk-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
            <div className="cmdk" role="dialog" aria-modal="true" aria-label="Command palette">
                <input
                    ref={inputRef}
                    className="cmdk-input"
                    placeholder="Search commands, samples, recent analyses…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onInputKey}
                    aria-label="Command"
                />
                <div className="cmdk-list" ref={listRef}>
                    {grouped.length === 0 && <div className="cmdk-empty">No matches.</div>}
                    {grouped.map(([group, items]) => (
                        <div key={group}>
                            <div className="cmdk-group">{group}</div>
                            {items.map((c) => {
                                flatIndex++;
                                const idx = flatIndex;
                                return (
                                    <div
                                        key={c.id}
                                        className="cmdk-item"
                                        role="option"
                                        aria-selected={idx === active}
                                        onMouseEnter={() => setActive(idx)}
                                        onMouseDown={(e) => { e.preventDefault(); c.run(); }}
                                    >
                                        <span className="ic">{c.icon}</span>
                                        <span>{c.label}</span>
                                        {c.hint && <span className="hint">{c.hint}</span>}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
