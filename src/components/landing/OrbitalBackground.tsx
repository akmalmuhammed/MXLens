import { motion } from "framer-motion";

interface OrbitCircleProps {
    size: number;
    duration: number;
    delay?: number;
    reverse?: boolean;
    color: "primary" | "accent" | "purple" | "muted";
    opacity?: number;
    blur?: boolean;
    offsetX?: number;
    offsetY?: number;
}

const colorClasses = {
    primary: "border-primary/40",
    accent: "border-accent/30",
    purple: "border-purple-500/30",
    muted: "border-muted-foreground/20",
};

const glowClasses = {
    primary: "shadow-[0_0_60px_hsl(175_90%_45%/0.3)]",
    accent: "shadow-[0_0_50px_hsl(155_100%_45%/0.25)]",
    purple: "shadow-[0_0_50px_hsl(280_70%_50%/0.25)]",
    muted: "shadow-[0_0_30px_hsl(220_10%_55%/0.15)]",
};

const OrbitCircle = ({
    size,
    duration,
    delay = 0,
    reverse = false,
    color,
    opacity = 1,
    blur = false,
    offsetX = 0,
    offsetY = 0,
}: OrbitCircleProps) => {
    return (
        <motion.div
            className={`absolute rounded-full border-2 ${colorClasses[color]} ${glowClasses[color]}`}
            style={{
                width: size,
                height: size,
                left: `calc(50% - ${size / 2}px + ${offsetX}px)`,
                top: `calc(50% - ${size / 2}px + ${offsetY}px)`,
                opacity,
                filter: blur ? "blur(1px)" : "none",
                willChange: "transform",
                transform: "translateZ(0)", // Force GPU layer
            }}
            animate={{
                rotate: reverse ? -360 : 360,
            }}
            transition={{
                duration,
                repeat: Infinity,
                ease: "linear",
                delay,
            }}
        />
    );
};

export const OrbitalBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Central glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-50" />

            {/* Orbital circles */}
            <OrbitCircle
                size={320}
                duration={25}
                color="primary"
                opacity={0.8}
                offsetY={-20}
            />
            <OrbitCircle
                size={280}
                duration={20}
                reverse
                color="accent"
                opacity={0.6}
                offsetX={30}
                offsetY={10}
            />
            <OrbitCircle
                size={380}
                duration={35}
                color="purple"
                opacity={0.5}
                blur
                offsetX={-20}
                offsetY={-30}
            />
            <OrbitCircle
                size={240}
                duration={18}
                reverse
                color="muted"
                opacity={0.7}
                offsetX={-40}
                offsetY={20}
            />
            <OrbitCircle
                size={420}
                duration={40}
                color="primary"
                opacity={0.3}
                blur
                offsetY={40}
            />
            <OrbitCircle
                size={200}
                duration={15}
                reverse
                color="accent"
                opacity={0.5}
                offsetX={50}
                offsetY={-40}
            />
            <OrbitCircle
                size={350}
                duration={30}
                color="purple"
                opacity={0.4}
                offsetX={20}
                offsetY={30}
            />

            {/* Additional glowing dots on orbits */}
            <motion.div
                className="absolute top-1/2 left-1/2 w-3 h-3 bg-primary rounded-full shadow-[0_0_20px_hsl(175_90%_45%/0.8)]"
                style={{ marginLeft: -6, marginTop: -6 }}
                animate={{
                    x: [160, -160, 160],
                    y: [-80, 80, -80],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />
            <motion.div
                className="absolute top-1/2 left-1/2 w-2 h-2 bg-accent rounded-full shadow-[0_0_15px_hsl(155_100%_45%/0.8)]"
                style={{ marginLeft: -4, marginTop: -4 }}
                animate={{
                    x: [-140, 140, -140],
                    y: [70, -70, 70],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />
        </div>
    );
};
