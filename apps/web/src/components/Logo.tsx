export function Logo({ className }: { className?: string }) {
    // An aperture/lens formed from two opposed chevrons meeting at a focal point.
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="1.5" y="1.5" width="21" height="21" rx="7" stroke="var(--signal)" strokeWidth="1.5" />
            <path d="M7 7 L12 12 L7 17" stroke="var(--text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 7 L12 12 L17 17" stroke="var(--signal)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
