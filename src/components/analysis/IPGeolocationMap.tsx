"use client";

import { useMemo } from "react";
import { GeoLocation, countryCodeToFlag } from "@/lib/threat-intel/geolocation";
import { MapPin, Globe, Wifi } from "lucide-react";

interface IPMapProps {
    locations: GeoLocation[];
    className?: string;
}

// Convert lat/lng to SVG coordinates (simple equirectangular projection)
function latLngToSvg(lat: number, lng: number, width: number, height: number): { x: number; y: number } {
    const x = ((lng + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
}

export function IPGeolocationMap({ locations, className = "" }: IPMapProps) {
    // Filter out locations without valid coordinates
    const validLocations = useMemo(() =>
        locations.filter(loc => loc.lat !== 0 || loc.lng !== 0),
        [locations]
    );

    // Summary stats
    const countries = useMemo(() =>
        [...new Set(validLocations.map(loc => loc.countryCode))],
        [validLocations]
    );

    const svgWidth = 800;
    const svgHeight = 400;

    // Convert locations to SVG coordinates
    const points = useMemo(() =>
        validLocations.map((loc, idx) => ({
            ...loc,
            ...latLngToSvg(loc.lat, loc.lng, svgWidth, svgHeight),
            index: idx
        })),
        [validLocations]
    );

    if (validLocations.length === 0) {
        return (
            <div className={`bg-muted/20 rounded-xl border flex flex-col items-center justify-center gap-3 text-muted-foreground ${className}`} style={{ minHeight: "300px" }}>
                <MapPin className="w-8 h-8" />
                <p className="text-sm">No geolocatable IPs found</p>
            </div>
        );
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Stats Bar */}
            <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-lg border">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="font-medium">{validLocations.length}</span>
                    <span className="text-muted-foreground">IPs Mapped</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-lg border">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{countries.length}</span>
                    <span className="text-muted-foreground">Countries</span>
                </div>
                <div className="flex gap-1.5">
                    {countries.slice(0, 5).map(code => (
                        <span key={code} className="text-lg" title={code}>
                            {countryCodeToFlag(code)}
                        </span>
                    ))}
                    {countries.length > 5 && (
                        <span className="text-muted-foreground text-xs ml-1">+{countries.length - 5}</span>
                    )}
                </div>
            </div>

            {/* SVG World Map */}
            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-gray-950" style={{ minHeight: "350px" }}>
                <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-auto"
                    style={{ minHeight: "350px" }}
                >
                    {/* Gradient definitions */}
                    <defs>
                        {/* Glow filter for dots */}
                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        {/* Radial gradient for dot */}
                        <radialGradient id="dotGradient" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#ff4444" stopOpacity="1" />
                            <stop offset="100%" stopColor="#ff0000" stopOpacity="0.3" />
                        </radialGradient>
                    </defs>

                    {/* World map outline - simplified continents */}
                    <g stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" fill="none">
                        {/* North America */}
                        <path d="M 50,80 L 80,60 L 140,50 L 180,70 L 200,100 L 180,140 L 150,160 L 120,180 L 80,170 L 50,140 Z" />
                        {/* South America */}
                        <path d="M 120,180 L 150,190 L 170,220 L 180,280 L 160,340 L 130,350 L 100,320 L 90,260 L 100,200 Z" />
                        {/* Europe */}
                        <path d="M 380,60 L 420,50 L 460,60 L 480,80 L 470,110 L 430,120 L 390,110 L 370,90 Z" />
                        {/* Africa */}
                        <path d="M 380,130 L 420,120 L 480,130 L 500,180 L 490,260 L 460,300 L 400,300 L 370,260 L 360,200 L 370,150 Z" />
                        {/* Asia */}
                        <path d="M 480,50 L 550,40 L 650,50 L 720,80 L 750,120 L 730,160 L 680,180 L 600,170 L 540,150 L 500,130 L 480,90 Z" />
                        {/* Australia */}
                        <path d="M 640,260 L 700,250 L 750,270 L 760,310 L 740,340 L 680,350 L 640,330 L 630,290 Z" />
                        {/* Grid lines */}
                        <line x1="0" y1="200" x2="800" y2="200" strokeDasharray="2,4" />
                        <line x1="400" y1="0" x2="400" y2="400" strokeDasharray="2,4" />
                    </g>

                    {/* Connection lines between IPs */}
                    {points.length > 1 && (
                        <g>
                            {points.slice(0, -1).map((point, idx) => (
                                <line
                                    key={`line-${idx}`}
                                    x1={point.x}
                                    y1={point.y}
                                    x2={points[idx + 1].x}
                                    y2={points[idx + 1].y}
                                    stroke="rgba(255,100,100,0.4)"
                                    strokeWidth="1"
                                    strokeDasharray="4,4"
                                >
                                    <animate
                                        attributeName="stroke-dashoffset"
                                        from="0"
                                        to="8"
                                        dur="1s"
                                        repeatCount="indefinite"
                                    />
                                </line>
                            ))}
                        </g>
                    )}

                    {/* IP Location dots with pulse animation */}
                    {points.map((point, idx) => (
                        <g key={`point-${idx}`}>
                            {/* Outer pulse ring */}
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="8"
                                fill="none"
                                stroke="#ff4444"
                                strokeWidth="2"
                                opacity="0"
                            >
                                <animate
                                    attributeName="r"
                                    from="6"
                                    to="20"
                                    dur="1.5s"
                                    repeatCount="indefinite"
                                />
                                <animate
                                    attributeName="opacity"
                                    from="0.8"
                                    to="0"
                                    dur="1.5s"
                                    repeatCount="indefinite"
                                />
                            </circle>

                            {/* Second pulse ring (offset) */}
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="8"
                                fill="none"
                                stroke="#ff4444"
                                strokeWidth="1"
                                opacity="0"
                            >
                                <animate
                                    attributeName="r"
                                    from="6"
                                    to="25"
                                    dur="1.5s"
                                    begin="0.5s"
                                    repeatCount="indefinite"
                                />
                                <animate
                                    attributeName="opacity"
                                    from="0.5"
                                    to="0"
                                    dur="1.5s"
                                    begin="0.5s"
                                    repeatCount="indefinite"
                                />
                            </circle>

                            {/* Main dot with glow */}
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="6"
                                fill="url(#dotGradient)"
                                filter="url(#glow)"
                            >
                                <animate
                                    attributeName="r"
                                    values="5;7;5"
                                    dur="1s"
                                    repeatCount="indefinite"
                                />
                            </circle>

                            {/* Inner bright core */}
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="2"
                                fill="#ffffff"
                            >
                                <animate
                                    attributeName="opacity"
                                    values="1;0.5;1"
                                    dur="0.5s"
                                    repeatCount="indefinite"
                                />
                            </circle>

                            {/* Hop number label */}
                            <text
                                x={point.x + 12}
                                y={point.y - 8}
                                fill="rgba(255,255,255,0.7)"
                                fontSize="10"
                                fontFamily="monospace"
                            >
                                #{idx + 1}
                            </text>
                        </g>
                    ))}
                </svg>

                {/* Country labels overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                    {points.map((point, idx) => (
                        <div
                            key={`label-${idx}`}
                            className="flex items-center gap-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded border border-red-500/30 text-xs"
                        >
                            <span className="text-red-400 font-bold">#{idx + 1}</span>
                            <span className="text-white font-mono">{point.ip}</span>
                            <span className="text-muted-foreground">→</span>
                            <span>{countryCodeToFlag(point.countryCode)}</span>
                            <span className="text-white">{point.city}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* IP Details List */}
            <div className="bg-muted/20 rounded-lg border divide-y divide-border/50 max-h-[200px] overflow-y-auto">
                {validLocations.map((loc, idx) => (
                    <div key={`${loc.ip}-${idx}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center animate-pulse">
                                {idx + 1}
                            </div>
                            <div>
                                <div className="font-mono text-sm">{loc.ip}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Wifi className="w-3 h-3" />
                                    {loc.org || "Unknown ISP"}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{countryCodeToFlag(loc.countryCode)}</span>
                                <span className="text-sm">{loc.city}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">{loc.country}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
