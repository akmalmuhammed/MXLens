"use client";

import { useMemo, useState } from "react";
import { GeoLocation, countryCodeToFlag } from "@/lib/threat-intel/geolocation";
import { MapPin, Globe, Wifi, Maximize2 } from "lucide-react";
import Image from "next/image";

interface IPMapProps {
    locations: GeoLocation[];
    className?: string;
}

// Convert lat/lng to percentage X/Y for styling
// Assumes equirectangular projection (standard for most flat maps)
function geoToPercent(lat: number, lng: number): { x: number; y: number } {
    // Latitude: 90 (North) to -90 (South) -> 0% to 100%
    // Longitude: -180 (West) to 180 (East) -> 0% to 100%
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
}

export function IPGeolocationMap({ locations, className = "" }: IPMapProps) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    const validLocations = useMemo(() =>
        locations.filter(loc => (loc.lat !== 0 || loc.lng !== 0)),
        [locations]
    );

    const countries = useMemo(() =>
        [...new Set(validLocations.map(loc => loc.countryCode))],
        [validLocations]
    );

    if (validLocations.length === 0) {
        return (
            <div className={`bg-black/40 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-3 h-[300px] ${className}`}>
                <MapPin className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No geolocatable IPs found</p>
            </div>
        );
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Stats Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-700">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                        <span className="font-medium text-zinc-100">{validLocations.length}</span>
                        <span className="text-zinc-500">IPs Detected</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-700">
                        <Globe className="w-3.5 h-3.5 text-blue-400" />
                        <span className="font-medium text-zinc-100">{countries.length}</span>
                        <span className="text-zinc-500">Countries</span>
                    </div>
                </div>
                <div className="flex gap-1.5 opacity-50">
                    {countries.slice(0, 5).map(code => (
                        <span key={code} className="text-lg grayscale hover:grayscale-0 transition-all cursor-help" title={code}>
                            {countryCodeToFlag(code)}
                        </span>
                    ))}
                </div>
            </div>

            {/* Map Container */}
            <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden border border-white/10 bg-black group shadow-2xl">
                {/* Background Image */}
                <Image
                    src="/world-map.png"
                    alt="World Map"
                    fill
                    className="object-cover opacity-80"
                    priority
                />

                {/* Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.4)_100%)]" />

                {/* Markers Layer */}
                <div className="absolute inset-0 p-[2%]"> {/* Slight padding for edge markers */}
                    {validLocations.map((loc, idx) => {
                        const { x, y } = geoToPercent(loc.lat, loc.lng);
                        const isHovered = hoveredIdx === idx;

                        return (
                            <div
                                key={`${loc.ip}-${idx}`}
                                className="absolute"
                                style={{
                                    left: `${x}%`,
                                    top: `${y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: isHovered ? 50 : 10
                                }}
                                onMouseEnter={() => setHoveredIdx(idx)}
                                onMouseLeave={() => setHoveredIdx(null)}
                            >
                                {/* Ping Animation */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-red-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />

                                {/* Core Dot */}
                                <div className={`relative w-3 h-3 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,1)] border-2 border-white transition-transform duration-300 ${isHovered ? 'scale-150' : 'scale-100'}`} />

                                {/* Tooltip */}
                                <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-black/90 backdrop-blur border border-red-500/30 rounded flex items-center gap-2 whitespace-nowrap transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                                    <span className="text-xs font-mono text-red-400 font-bold">#{idx + 1}</span>
                                    <span className="text-xs text-white font-medium">{loc.city}</span>
                                    <span className="text-xs text-zinc-500">{countryCodeToFlag(loc.countryCode)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* List View */}
            <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 divide-y divide-zinc-800/50 max-h-[200px] overflow-y-auto">
                {validLocations.map((loc, idx) => (
                    <div
                        key={`${loc.ip}-${idx}`}
                        className={`flex items-center justify-between px-4 py-3 transition-colors cursor-pointer ${hoveredIdx === idx ? 'bg-red-500/5' : 'hover:bg-zinc-800/50'}`}
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-red-500/10 text-red-500 text-xs font-bold flex items-center justify-center border border-red-500/20">
                                {idx + 1}
                            </div>
                            <div>
                                <div className="font-mono text-sm text-zinc-200">{loc.ip}</div>
                                <div className="text-xs text-zinc-500 flex items-center gap-1">
                                    <Wifi className="w-3 h-3" />
                                    {loc.org || "Unknown Network"}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center justify-end gap-2">
                                <span className="text-sm text-zinc-300">{loc.city}</span>
                                <span className="text-lg">{countryCodeToFlag(loc.countryCode)}</span>
                            </div>
                            <div className="text-xs text-zinc-600">{loc.country}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
