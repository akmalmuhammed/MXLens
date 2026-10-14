export function Logo({ className }: { className?: string }) {
    // A lens aperture: a focal ring with two opposed blades resolving to a center.
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="1.5" y="1.5" width="21" height="21" rx="7.5" stroke="var(--line-strong)" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="5.4" stroke="var(--signal)" strokeWidth="1.6" />
            <path d="M12 3.2 V6.6 M12 17.4 V20.8 M3.2 12 H6.6 M17.4 12 H20.8" stroke="var(--text-dim)" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="12" cy="12" r="1.7" fill="var(--signal)" />
        </svg>
    );
}

export function Reticle({ className }: { className?: string }) {
    // Large decorative focal reticle behind the hero. Purely presentational.
    return (
        <svg className={className} viewBox="0 0 400 400" fill="none" aria-hidden="true">
            <circle cx="200" cy="200" r="150" stroke="var(--line-strong)" strokeWidth="1" />
            <circle cx="200" cy="200" r="110" stroke="var(--line)" strokeWidth="1" strokeDasharray="2 6" />
            <circle className="spin" cx="200" cy="200" r="70" stroke="var(--signal)" strokeWidth="1.25" strokeDasharray="1 7" opacity="0.8" />
            <path d="M200 20 V110 M200 290 V380 M20 200 H110 M290 200 H380" stroke="var(--line-strong)" strokeWidth="1" />
            <path d="M200 140 V260 M140 200 H260" stroke="var(--signal)" strokeWidth="1" opacity="0.5" />
            <circle className="core" cx="200" cy="200" r="4" fill="var(--signal)" />
            <g stroke="var(--line-strong)" strokeWidth="1">
                <path d="M150 150 L135 135 M135 150 L135 135 L150 135" />
                <path d="M250 150 L265 135 M265 150 L265 135 L250 135" />
                <path d="M150 250 L135 265 M135 250 L135 265 L150 265" />
                <path d="M250 250 L265 265 M265 250 L265 265 L250 265" />
            </g>
        </svg>
    );
}
