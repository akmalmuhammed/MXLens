import type { Verdict } from "@mxlens/engine";

const COLOR: Record<Verdict, string> = { malicious: "var(--crit)", suspicious: "var(--med)", clean: "var(--good)" };

/** A focal-ring readout: the risk score drawn as an arc, like an instrument dial. */
export function VerdictGauge({ score, verdict, size = 104 }: { score: number; verdict: Verdict; size?: number }) {
    const stroke = 7;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(100, score)) / 100;
    return (
        <div className="gauge" style={{ minWidth: size + 56 }}>
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-4)" strokeWidth={stroke} />
                <circle
                    cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COLOR[verdict]} strokeWidth={stroke}
                    strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
                />
            </svg>
            <div className="readout">
                <span className="num">{score}</span>
                <span className="den">RISK</span>
            </div>
        </div>
    );
}
