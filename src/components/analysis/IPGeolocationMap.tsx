"use client";

import { useMemo, useState, useEffect } from "react";
import { GeoLocation, countryCodeToFlag } from "@/lib/threat-intel/geolocation";
import { MapPin, Globe, Wifi, ZoomIn, ZoomOut, Check } from "lucide-react";
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
    Line,
    ZoomableGroup
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";

// Standard TopoJSON for world map (110m resolution is good balance of detail/size)
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface IPMapProps {
    locations: GeoLocation[];
    className?: string;
}

export function IPGeolocationMap({ locations, className = "" }: IPMapProps) {
    const [mounted, setMounted] = useState(false);
    const [position, setPosition] = useState({ coordinates: [0, 20], zoom: 1 });

    useEffect(() => {
        setMounted(true);
    }, []);

    // Filter valid locations
    const validLocations = useMemo(() =>
        locations.filter(loc => (loc.lat !== 0 || loc.lng !== 0)),
        [locations]
    );

    // Get unique detected country codes (ISO Alpha-2 to standard names mapping might be needed, 
    // but verifying against TopoJSON which usually has ISO Alpha-3 or numeric.
    // We'll rely on matching or just highlight markers effectively first, 
    // but to highlight countries we need ISO-3 codes.
    // For now, let's focus on the markers which are accurate lat/lng.)

    // Markers are the most important for "accuracy" of IP location.

    // Calculate simple stats
    const countries = useMemo(() =>
        [...new Set(validLocations.map(loc => loc.countryCode))],
        [validLocations]
    );

    const handleZoomIn = () => {
        if (position.zoom >= 4) return;
        setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
    };

    const handleZoomOut = () => {
        if (position.zoom <= 1) return;
        setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
    };

    if (!mounted) return (
        <div className={`bg-muted/20 rounded-xl border flex flex-col items-center justify-center gap-3 h-[400px] ${className}`}>
            <Globe className="w-8 h-8 animate-pulse text-muted-foreground" />
            <p className="text-sm">Loading high-fidelity map...</p>
        </div>
    );

    if (validLocations.length === 0) {
        return (
            <div className={`bg-muted/20 rounded-xl border flex flex-col items-center justify-center gap-3 h-[400px] ${className}`}>
                <MapPin className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm">No geolocatable IPs found</p>
            </div>
        );
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Stats Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                <div className="flex gap-4">
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
                </div>

                <div className="flex gap-1">
                    <button onClick={handleZoomOut} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition">
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <button onClick={handleZoomIn} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition">
                        <ZoomIn className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-2xl h-[450px]">
                <ComposableMap
                    projection="geoEqualEarth"
                    projectionConfig={{
                        scale: 180,
                        center: [0, 0]
                    }}
                    height={450}
                    width={800}
                    className="w-full h-full"
                >
                    <ZoomableGroup
                        zoom={position.zoom}
                        center={position.coordinates as [number, number]}
                        onMoveEnd={({ coordinates, zoom }) => setPosition({ coordinates: coordinates as [number, number], zoom })}
                    >
                        {/* Map Geographies */}
                        <Geographies geography={GEO_URL}>
                            {({ geographies }) =>
                                geographies.map((geo) => {
                                    // We could check if this country contains an IP to highlight it
                                    // For now just valid plain map
                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            fill="#1a1a1a"
                                            stroke="#333"
                                            strokeWidth={0.5}
                                            style={{
                                                default: { outline: "none" },
                                                hover: { fill: "#2a2a2a", outline: "none" },
                                                pressed: { outline: "none" },
                                            }}
                                        />
                                    );
                                })
                            }
                        </Geographies>

                        {/* Connection Lines */}
                        {validLocations.length > 1 && validLocations.slice(0, -1).map((loc, i) => (
                            <Line
                                key={`line-${i}`}
                                from={[loc.lng, loc.lat]}
                                to={[validLocations[i + 1].lng, validLocations[i + 1].lat]}
                                stroke="#ef4444"
                                strokeWidth={1.5}
                                strokeOpacity={0.3}
                                strokeDasharray="4 4"
                            />
                        ))}

                        {/* IP Markers */}
                        {validLocations.map((loc, i) => (
                            <Marker key={loc.ip} coordinates={[loc.lng, loc.lat]}>
                                <g
                                    fill="none"
                                    stroke="#ef4444"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    transform="translate(-12, -24)"
                                >
                                    <circle cx="12" cy="10" r="3" fill="#ef4444" />
                                    <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" />
                                </g>
                                <text
                                    textAnchor="middle"
                                    y={-28}
                                    style={{ fontFamily: "system-ui", fill: "white", fontSize: "10px", fontWeight: "bold", textShadow: "0px 2px 2px rgba(0,0,0,0.8)" }}
                                >
                                    {loc.countryCode} · {loc.city}
                                </text>
                            </Marker>
                        ))}
                    </ZoomableGroup>
                </ComposableMap>

                {/* Credit */}
                <div className="absolute bottom-2 right-4 text-[10px] text-muted-foreground opacity-50">
                    High-Fidelity GeoJSON Map
                </div>
            </div>

            {/* List View */}
            <div className="bg-muted/20 rounded-lg border divide-y divide-border/50 max-h-[200px] overflow-y-auto">
                {validLocations.map((loc, idx) => (
                    <div key={`${loc.ip}-${idx}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                                {idx + 1}
                            </div>
                            <div>
                                <div className="font-mono text-sm">{loc.ip}</div>
                                <div className="text-xs text-muted-foreground">{loc.org || "Unknown ISP"}</div>
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
