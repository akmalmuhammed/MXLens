"use client";

import { useEffect, useState } from "react";
import type { Verdict } from "@mxlens/engine";

const COLOR: Record<Verdict, string> = { malicious: "var(--crit)", suspicious: "var(--med)", clean: "var(--good)" };

function prefersReducedMotion(): boolean {
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
}

/** A focal-ring readout: the score resolves into a reading — the arc fills and the number counts up. */
export function VerdictGauge({ score, verdict, size = 108 }: { score: number; verdict: Verdict; size?: number }) {
    const stroke = 7;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const [shown, setShown] = useState(0);
    const [armed, setArmed] = useState(false);

    useEffect(() => {
        if (prefersReducedMotion()) { setShown(score); setArmed(true); return; }
        const raf = requestAnimationFrame(() => setArmed(true)); // let the arc transition from empty
        const start = performance.now();
        const dur = 850;
        let frame = 0;
        const tick = (t: number) => {
            const p = Math.min(1, (t - start) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            setShown(Math.round(score * eased));
            if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => { cancelAnimationFrame(raf); cancelAnimationFrame(frame); };
    }, [score]);

    const pct = Math.max(0, Math.min(100, score)) / 100;
    return (
        <div className="gauge" style={{ minWidth: size + 56 }}>
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-4)" strokeWidth={stroke} />
                <circle
                    className="arc" cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COLOR[verdict]} strokeWidth={stroke}
                    strokeLinecap="round" strokeDasharray={c} strokeDashoffset={armed ? c * (1 - pct) : c}
                />
            </svg>
            <div className="readout">
                <span className="num">{shown}</span>
                <span className="den">RISK</span>
            </div>
        </div>
    );
}
