"use client";

import { useMemo, useState } from "react";
import { GeoLocation, countryCodeToFlag } from "@/lib/threat-intel/geolocation";
import { MapPin, Globe, Wifi } from "lucide-react";

interface IPMapProps {
    locations: GeoLocation[];
    className?: string;
}

// Convert lat/lng to SVG x/y using Mercator-like projection
function geoToSvg(lat: number, lng: number): { x: number; y: number } {
    // SVG viewBox is 1000x500
    const x = ((lng + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 500;
    return { x, y };
}

export function IPGeolocationMap({ locations, className = "" }: IPMapProps) {
    const [hoveredIp, setHoveredIp] = useState<string | null>(null);

    // Filter valid locations
    const validLocations = useMemo(() =>
        locations.filter(loc => (loc.lat !== 0 || loc.lng !== 0)),
        [locations]
    );

    // Calculate stats
    const countries = useMemo(() =>
        [...new Set(validLocations.map(loc => loc.countryCode))],
        [validLocations]
    );

    // Convert to SVG coordinates
    const markers = useMemo(() =>
        validLocations.map((loc, idx) => ({
            ...loc,
            ...geoToSvg(loc.lat, loc.lng),
            index: idx
        })),
        [validLocations]
    );

    if (validLocations.length === 0) {
        return (
            <div className={`bg-muted/20 rounded-xl border flex flex-col items-center justify-center gap-3 h-[350px] ${className}`}>
                <MapPin className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No geolocatable IPs found</p>
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
                    <span className="text-muted-foreground">IPs Detected</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-lg border">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{countries.length}</span>
                    <span className="text-muted-foreground">Countries</span>
                </div>
                <div className="flex gap-1.5">
                    {countries.slice(0, 8).map(code => (
                        <span key={code} className="text-lg" title={code}>
                            {countryCodeToFlag(code)}
                        </span>
                    ))}
                </div>
            </div>

            {/* Map Container */}
            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#0d1117]" style={{ minHeight: "400px" }}>
                <svg
                    viewBox="0 0 1000 500"
                    className="w-full h-auto"
                    style={{ minHeight: "400px", background: "#0d1117" }}
                >
                    <defs>
                        {/* Glow filter */}
                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* World Map - Using embedded image for reliability */}
                    <image
                        href="https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg"
                        x="0"
                        y="0"
                        width="1000"
                        height="500"
                        opacity="0.15"
                        style={{ filter: "invert(1)" }}
                    />

                    {/* Grid lines for reference */}
                    <g stroke="rgba(255,255,255,0.03)" strokeWidth="0.5">
                        {[...Array(9)].map((_, i) => (
                            <line key={`h${i}`} x1="0" y1={(i + 1) * 50} x2="1000" y2={(i + 1) * 50} />
                        ))}
                        {[...Array(19)].map((_, i) => (
                            <line key={`v${i}`} x1={(i + 1) * 50} y1="0" x2={(i + 1) * 50} y2="500" />
                        ))}
                    </g>

                    {/* Connection lines between markers */}
                    {markers.length > 1 && markers.slice(0, -1).map((m, i) => (
                        <line
                            key={`line-${i}`}
                            x1={m.x}
                            y1={m.y}
                            x2={markers[i + 1].x}
                            y2={markers[i + 1].y}
                            stroke="#ef4444"
                            strokeWidth="1.5"
                            strokeOpacity="0.4"
                            strokeDasharray="6 4"
                        >
                            <animate
                                attributeName="stroke-dashoffset"
                                from="0"
                                to="10"
                                dur="1s"
                                repeatCount="indefinite"
                            />
                        </line>
                    ))}

                    {/* IP Markers */}
                    {markers.map((m, i) => (
                        <g
                            key={m.ip}
                            onMouseEnter={() => setHoveredIp(m.ip)}
                            onMouseLeave={() => setHoveredIp(null)}
                            style={{ cursor: "pointer" }}
                        >
                            {/* Outer pulse ring */}
                            <circle cx={m.x} cy={m.y} r="12" fill="none" stroke="#ef4444" strokeWidth="2">
                                <animate attributeName="r" from="8" to="25" dur="1.5s" repeatCount="indefinite" />
                                <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
                            </circle>

                            {/* Second pulse ring */}
                            <circle cx={m.x} cy={m.y} r="12" fill="none" stroke="#ef4444" strokeWidth="1">
                                <animate attributeName="r" from="8" to="30" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
                                <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
                            </circle>

                            {/* Main dot with glow */}
                            <circle
                                cx={m.x}
                                cy={m.y}
                                r="8"
                                fill="#ef4444"
                                filter="url(#glow)"
                            >
                                <animate attributeName="r" values="6;9;6" dur="1s" repeatCount="indefinite" />
                            </circle>

                            {/* White core */}
                            <circle cx={m.x} cy={m.y} r="3" fill="#fff">
                                <animate attributeName="opacity" values="1;0.5;1" dur="0.5s" repeatCount="indefinite" />
                            </circle>

                            {/* Label */}
                            <g transform={`translate(${m.x}, ${m.y - 18})`}>
                                <rect
                                    x="-50"
                                    y="-10"
                                    width="100"
                                    height="16"
                                    rx="4"
                                    fill="rgba(0,0,0,0.8)"
                                />
                                <text
                                    textAnchor="middle"
                                    y="2"
                                    fill="#fff"
                                    fontSize="9"
                                    fontFamily="system-ui, sans-serif"
                                    fontWeight="600"
                                >
                                    {m.countryCode} · {m.city?.substring(0, 12)}
                                </text>
                            </g>

                            {/* Hop number badge */}
                            <circle cx={m.x + 12} cy={m.y - 8} r="8" fill="#ef4444" />
                            <text
                                x={m.x + 12}
                                y={m.y - 5}
                                textAnchor="middle"
                                fill="#fff"
                                fontSize="9"
                                fontWeight="bold"
                            >
                                {i + 1}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>

            {/* IP Details List */}
            <div className="bg-muted/20 rounded-lg border divide-y divide-border/50 max-h-[180px] overflow-y-auto">
                {validLocations.map((loc, idx) => (
                    <div
                        key={`${loc.ip}-${idx}`}
                        className={`flex items-center justify-between px-4 py-2.5 transition-colors ${hoveredIp === loc.ip ? "bg-red-500/10" : "hover:bg-muted/30"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center">
                                <span className="animate-pulse">{idx + 1}</span>
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
