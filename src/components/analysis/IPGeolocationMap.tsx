"use client";

import { useMemo, useState } from "react";
import { GeoLocation, countryCodeToFlag } from "@/lib/threat-intel/geolocation";
import { MapPin, Globe, Wifi } from "lucide-react";

interface IPMapProps {
    locations: GeoLocation[];
    className?: string;
}

// Convert lat/lng to SVG x/y (Equirectangular projection - simple and accurate)
function geoToSvg(lat: number, lng: number): { x: number; y: number } {
    // SVG viewBox is 360x180 (1:1 with degrees)
    const x = lng + 180; // -180 to 180 → 0 to 360
    const y = 90 - lat;  // 90 to -90 → 0 to 180
    return { x, y };
}

export function IPGeolocationMap({ locations, className = "" }: IPMapProps) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

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
            <div className={`bg-zinc-900/50 rounded-xl border border-zinc-800 flex flex-col items-center justify-center gap-3 h-[350px] ${className}`}>
                <MapPin className="w-8 h-8 text-zinc-600" />
                <p className="text-sm text-zinc-500">No geolocatable IPs found</p>
            </div>
        );
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Stats Bar */}
            <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="font-medium text-white">{validLocations.length}</span>
                    <span className="text-zinc-400">IPs Detected</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-white">{countries.length}</span>
                    <span className="text-zinc-400">Countries</span>
                </div>
                <div className="flex gap-1.5 items-center">
                    {countries.slice(0, 6).map(code => (
                        <span key={code} className="text-lg" title={code}>
                            {countryCodeToFlag(code)}
                        </span>
                    ))}
                </div>
            </div>

            {/* Map Container */}
            <div className="relative rounded-xl overflow-hidden border border-zinc-700/50 bg-gradient-to-b from-zinc-900 to-black" style={{ minHeight: "380px" }}>
                <svg
                    viewBox="0 0 360 180"
                    className="w-full h-auto"
                    style={{ minHeight: "380px" }}
                    preserveAspectRatio="xMidYMid meet"
                >
                    <defs>
                        {/* Glow filter for markers */}
                        <filter id="redGlow" x="-100%" y="-100%" width="300%" height="300%">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        {/* Gradient for map background */}
                        <radialGradient id="mapBg" cx="50%" cy="50%" r="70%">
                            <stop offset="0%" stopColor="#1a1a2e" />
                            <stop offset="100%" stopColor="#0a0a0f" />
                        </radialGradient>
                    </defs>

                    {/* Background */}
                    <rect x="0" y="0" width="360" height="180" fill="url(#mapBg)" />

                    {/* Grid lines - longitude */}
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360].map(x => (
                        <line key={`lng-${x}`} x1={x} y1="0" x2={x} y2="180" stroke="#ffffff" strokeOpacity="0.03" strokeWidth="0.3" />
                    ))}

                    {/* Grid lines - latitude */}
                    {[0, 30, 60, 90, 120, 150, 180].map(y => (
                        <line key={`lat-${y}`} x1="0" y1={y} x2="360" y2={y} stroke="#ffffff" strokeOpacity="0.03" strokeWidth="0.3" />
                    ))}

                    {/* Equator line (more visible) */}
                    <line x1="0" y1="90" x2="360" y2="90" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="0.5" strokeDasharray="2 2" />

                    {/* Simplified continent outlines - just dots to suggest landmasses */}
                    <g fill="#ffffff" fillOpacity="0.04">
                        {/* North America dot cluster */}
                        <circle cx="80" cy="55" r="20" />
                        <circle cx="100" cy="65" r="15" />
                        {/* South America */}
                        <circle cx="105" cy="115" r="12" />
                        <circle cx="100" cy="130" r="10" />
                        {/* Europe */}
                        <circle cx="190" cy="50" r="12" />
                        {/* Africa */}
                        <circle cx="195" cy="95" r="18" />
                        {/* Asia */}
                        <circle cx="260" cy="55" r="25" />
                        <circle cx="285" cy="70" r="15" />
                        {/* Australia */}
                        <circle cx="305" cy="130" r="12" />
                    </g>

                    {/* Connection lines between markers */}
                    {markers.length > 1 && markers.slice(0, -1).map((m, i) => (
                        <g key={`line-${i}`}>
                            <line
                                x1={m.x}
                                y1={m.y}
                                x2={markers[i + 1].x}
                                y2={markers[i + 1].y}
                                stroke="#ef4444"
                                strokeWidth="0.8"
                                strokeOpacity="0.5"
                                strokeDasharray="2 2"
                            >
                                <animate
                                    attributeName="stroke-dashoffset"
                                    from="0"
                                    to="4"
                                    dur="0.5s"
                                    repeatCount="indefinite"
                                />
                            </line>
                        </g>
                    ))}

                    {/* IP Markers */}
                    {markers.map((m, i) => (
                        <g
                            key={m.ip}
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            style={{ cursor: "pointer" }}
                        >
                            {/* Outer pulse ring 1 */}
                            <circle cx={m.x} cy={m.y} r="4" fill="none" stroke="#ef4444" strokeWidth="0.8">
                                <animate attributeName="r" from="3" to="10" dur="1.5s" repeatCount="indefinite" />
                                <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
                            </circle>

                            {/* Outer pulse ring 2 */}
                            <circle cx={m.x} cy={m.y} r="4" fill="none" stroke="#ef4444" strokeWidth="0.5">
                                <animate attributeName="r" from="3" to="12" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
                                <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
                            </circle>

                            {/* Main dot */}
                            <circle
                                cx={m.x}
                                cy={m.y}
                                r={hoveredIdx === i ? 4 : 3}
                                fill="#ef4444"
                                filter="url(#redGlow)"
                            >
                                <animate attributeName="r" values="2.5;3.5;2.5" dur="1s" repeatCount="indefinite" />
                            </circle>

                            {/* White core */}
                            <circle cx={m.x} cy={m.y} r="1" fill="#ffffff">
                                <animate attributeName="opacity" values="1;0.4;1" dur="0.5s" repeatCount="indefinite" />
                            </circle>

                            {/* Label (show on hover or always for first 3) */}
                            {(hoveredIdx === i || i < 3) && (
                                <g>
                                    <rect
                                        x={m.x - 25}
                                        y={m.y - 12}
                                        width="50"
                                        height="8"
                                        rx="2"
                                        fill="rgba(0,0,0,0.85)"
                                    />
                                    <text
                                        x={m.x}
                                        y={m.y - 6}
                                        textAnchor="middle"
                                        fill="#ffffff"
                                        fontSize="4"
                                        fontFamily="system-ui, sans-serif"
                                        fontWeight="600"
                                    >
                                        {m.countryCode} · {m.city?.substring(0, 10)}
                                    </text>
                                </g>
                            )}

                            {/* Hop number */}
                            <circle cx={m.x + 5} cy={m.y - 4} r="3" fill="#dc2626" />
                            <text
                                x={m.x + 5}
                                y={m.y - 2.5}
                                textAnchor="middle"
                                fill="#ffffff"
                                fontSize="3"
                                fontWeight="bold"
                            >
                                {i + 1}
                            </text>
                        </g>
                    ))}
                </svg>

                {/* Overlay gradient for depth */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/30 to-transparent" />
            </div>

            {/* IP Details List */}
            <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 divide-y divide-zinc-800/50 max-h-[180px] overflow-y-auto">
                {validLocations.map((loc, idx) => (
                    <div
                        key={`${loc.ip}-${idx}`}
                        className={`flex items-center justify-between px-4 py-2.5 transition-all ${hoveredIdx === idx ? "bg-red-500/10 border-l-2 border-l-red-500" : "hover:bg-zinc-800/50 border-l-2 border-l-transparent"
                            }`}
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center">
                                {idx + 1}
                            </div>
                            <div>
                                <div className="font-mono text-sm text-white">{loc.ip}</div>
                                <div className="text-xs text-zinc-500 flex items-center gap-1">
                                    <Wifi className="w-3 h-3" />
                                    {loc.org || "Unknown ISP"}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{countryCodeToFlag(loc.countryCode)}</span>
                                <span className="text-sm text-white">{loc.city}</span>
                            </div>
                            <div className="text-xs text-zinc-500">{loc.country}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
