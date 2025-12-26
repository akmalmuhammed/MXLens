"use client";

import { motion } from "framer-motion";

export function BackgroundAnimation() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none flex items-center justify-center">
            {/* Main container positioned to the right to match original aesthetic */}
            <div className="relative w-[50vw] h-[50vw] min-w-[600px] min-h-[600px] translate-x-1/4 -translate-y-10 opacity-60 dark:opacity-40">

                {/* Ring 1: Main Cyan Spirograph Ring - Strong Glow */}
                <motion.div
                    className="absolute inset-[10%] border-[2px] border-cyan-400/60 rounded-[50%_40%_50%_40%] shadow-[0_0_30px_rgba(34,211,238,0.4)]"
                    style={{ borderRadius: "50% 40% 50% 40% / 40% 50% 40% 50%" }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                />

                {/* Ring 2: Purple Intersecting Ring - Strong Glow */}
                <motion.div
                    className="absolute inset-[10%] border-[2px] border-purple-400/50 rounded-[40%_50%_40%_50%] shadow-[0_0_30px_rgba(168,85,247,0.3)]"
                    style={{ borderRadius: "40% 50% 40% 50% / 50% 40% 50% 40%" }}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                />

                {/* Ring 3: Center White/Blue Core - Intense Glow */}
                <motion.div
                    className="absolute inset-[25%] border-[3px] border-cyan-200/40 rounded-full shadow-[0_0_50px_rgba(34,211,238,0.5)]"
                    animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Ring 4: Large Outer Orbit - Faint but connecting */}
                <motion.div
                    className="absolute inset-0 border-[1px] border-slate-500/30 rounded-full"
                    style={{ borderRadius: "45% 55% 45% 55% / 55% 45% 55% 45%" }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
                />

                {/* Ring 5: Offset Ellipse for 3D feel */}
                <motion.div
                    className="absolute inset-[10%] border-[1px] border-cyan-300/30 rounded-[100%]"
                    style={{ transform: "rotate(45deg)", borderRadius: "60% 40% 60% 40% / 40% 60% 40% 60%" }}
                    animate={{ rotate: [45, 405] }}
                    transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
                />
            </div>
        </div>
    );
}
