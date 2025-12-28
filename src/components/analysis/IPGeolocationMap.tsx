"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { GeoLocation, countryCodeToFlag } from "@/lib/threat-intel/geolocation";
import { MapPin, Globe, Wifi, AlertTriangle } from "lucide-react";

// Dynamically import Leaflet components (no SSR)
const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import("react-leaflet").then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import("react-leaflet").then((mod) => mod.Popup),
    { ssr: false }
);
const Polyline = dynamic(
    () => import("react-leaflet").then((mod) => mod.Polyline),
    { ssr: false }
);

interface IPMapProps {
    locations: GeoLocation[];
    className?: string;
}

export function IPGeolocationMap({ locations, className = "" }: IPMapProps) {
    const [isClient, setIsClient] = useState(false);
    const [L, setL] = useState<any>(null);

    useEffect(() => {
        setIsClient(true);
        // Import Leaflet CSS and icon fix
        import("leaflet").then((leaflet) => {
            setL(leaflet.default);
            // Fix default marker icon issue in Next.js
            delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
            leaflet.default.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
                iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
                shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
            });
        });
    }, []);

    // Filter out locations without valid coordinates
    const validLocations = useMemo(() =>
        locations.filter(loc => loc.lat !== 0 || loc.lng !== 0),
        [locations]
    );

    // Calculate map bounds
    const bounds = useMemo(() => {
        if (validLocations.length === 0) return undefined;
        if (validLocations.length === 1) {
            return [[validLocations[0].lat, validLocations[0].lng]] as [number, number][];
        }
        return validLocations.map(loc => [loc.lat, loc.lng] as [number, number]);
    }, [validLocations]);

    // Create polyline path (email route)
    const pathCoordinates = useMemo(() =>
        validLocations.map(loc => [loc.lat, loc.lng] as [number, number]),
        [validLocations]
    );

    // Summary stats
    const countries = useMemo(() =>
        [...new Set(validLocations.map(loc => loc.countryCode))],
        [validLocations]
    );

    if (!isClient) {
        return (
            <div className={`bg-muted/30 rounded-xl border animate-pulse flex items-center justify-center ${className}`} style={{ minHeight: "300px" }}>
                <Globe className="w-8 h-8 text-muted-foreground animate-spin" />
            </div>
        );
    }

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
                    <MapPin className="w-4 h-4 text-primary" />
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

            {/* Map */}
            <div className="rounded-xl overflow-hidden border shadow-lg" style={{ height: "350px" }}>
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
                />
                <MapContainer
                    center={validLocations.length > 0 ? [validLocations[0].lat, validLocations[0].lng] : [20, 0]}
                    zoom={validLocations.length === 1 ? 6 : 2}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://carto.com">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />

                    {/* Email route polyline */}
                    {pathCoordinates.length > 1 && (
                        <Polyline
                            positions={pathCoordinates}
                            pathOptions={{
                                color: "#3b82f6",
                                weight: 2,
                                opacity: 0.6,
                                dashArray: "5, 10"
                            }}
                        />
                    )}

                    {/* IP markers */}
                    {validLocations.map((loc, idx) => (
                        <Marker key={`${loc.ip}-${idx}`} position={[loc.lat, loc.lng]}>
                            <Popup>
                                <div className="text-sm space-y-1 min-w-[180px]">
                                    <div className="font-mono font-bold text-primary">{loc.ip}</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{countryCodeToFlag(loc.countryCode)}</span>
                                        <span>{loc.city}, {loc.country}</span>
                                    </div>
                                    {loc.org && (
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Wifi className="w-3 h-3" />
                                            {loc.org}
                                        </div>
                                    )}
                                    <div className="text-xs text-muted-foreground">
                                        Hop #{idx + 1}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* IP List */}
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
