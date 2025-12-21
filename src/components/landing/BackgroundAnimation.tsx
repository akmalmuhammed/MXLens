export function BackgroundAnimation() {
    return (
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none select-none">
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid slice"
                className="w-full h-full opacity-30 dark:opacity-20 transition-opacity duration-500"
            >
                {/* Outer Ring - Lens Movement */}
                <circle cx="80" cy="50" r="20" className="stroke-cyan-600 dark:stroke-cyan-500 fill-none stroke-[0.2] animate-spin-slow origin-[80px_50px] animate-lens-breathe" />

                {/* Middle Ring - Reverse Spin */}
                <circle cx="80" cy="50" r="25" className="stroke-teal-600 dark:stroke-teal-500 fill-none stroke-[0.1] animate-spin-reverse origin-[80px_50px] opacity-70" />

                {/* Outer Pulse Ring */}
                <circle cx="80" cy="50" r="30" className="stroke-cyan-400 dark:stroke-cyan-300 fill-none stroke-[0.1] animate-spin-slow origin-[80px_50px] opacity-50 animate-lens-breathe" style={{ animationDelay: "1s" }} />

                {/* Inner Focus Ring */}
                <circle cx="80" cy="50" r="15" className="stroke-slate-400 dark:stroke-white fill-none stroke-[0.1] animate-spin-slow-reverse origin-[80px_50px] opacity-30" />
            </svg>
        </div>
    );
}
