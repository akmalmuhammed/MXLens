"use client";

import { useMemo } from "react";
import { GeoLocation, countryCodeToFlag } from "@/lib/threat-intel/geolocation";
import { MapPin, Globe, Wifi } from "lucide-react";

// Simplified country paths (major countries only for performance)
// These are simplified paths for a 1000x500 viewBox
const COUNTRY_PATHS: Record<string, { path: string; center: [number, number]; name: string }> = {
    US: {
        path: "M 48,140 L 58,125 L 85,120 L 115,115 L 145,120 L 175,115 L 195,130 L 205,150 L 195,165 L 175,175 L 145,180 L 115,185 L 85,180 L 55,170 Z M 30,175 L 45,165 L 55,175 L 50,190 L 35,195 Z",
        center: [120, 150],
        name: "United States"
    },
    CN: {
        path: "M 680,130 L 720,115 L 770,120 L 800,140 L 810,170 L 790,200 L 750,210 L 710,200 L 680,180 L 670,150 Z",
        center: [740, 160],
        name: "China"
    },
    RU: {
        path: "M 480,60 L 550,45 L 650,40 L 750,50 L 850,65 L 900,85 L 920,100 L 900,120 L 850,130 L 750,125 L 650,130 L 550,125 L 480,110 L 460,85 Z",
        center: [700, 90],
        name: "Russia"
    },
    IN: {
        path: "M 660,175 L 690,165 L 710,180 L 715,210 L 700,245 L 675,260 L 655,245 L 650,210 L 655,185 Z",
        center: [680, 215],
        name: "India"
    },
    BR: {
        path: "M 200,260 L 240,240 L 280,250 L 310,280 L 300,330 L 270,365 L 230,370 L 195,350 L 180,310 L 185,275 Z",
        center: [245, 305],
        name: "Brazil"
    },
    AU: {
        path: "M 780,320 L 830,305 L 880,315 L 910,345 L 900,380 L 860,400 L 810,395 L 775,370 L 765,340 Z",
        center: [840, 355],
        name: "Australia"
    },
    GB: {
        path: "M 418,105 L 428,95 L 438,100 L 440,118 L 432,128 L 420,125 L 415,115 Z",
        center: [428, 112],
        name: "United Kingdom"
    },
    DE: {
        path: "M 455,110 L 470,105 L 480,115 L 478,135 L 465,142 L 452,135 L 450,120 Z",
        center: [465, 123],
        name: "Germany"
    },
    FR: {
        path: "M 425,125 L 445,120 L 458,130 L 455,152 L 438,160 L 420,152 L 418,135 Z",
        center: [438, 140],
        name: "France"
    },
    JP: {
        path: "M 855,145 L 870,135 L 878,145 L 875,165 L 862,175 L 850,168 L 848,155 Z",
        center: [862, 155],
        name: "Japan"
    },
    CA: {
        path: "M 50,70 L 100,55 L 170,48 L 220,55 L 245,70 L 240,95 L 200,110 L 150,115 L 100,110 L 60,100 L 45,85 Z",
        center: [150, 82],
        name: "Canada"
    },
    MX: {
        path: "M 80,175 L 110,165 L 140,175 L 145,200 L 130,215 L 100,210 L 80,195 Z",
        center: [112, 190],
        name: "Mexico"
    },
    ZA: {
        path: "M 485,360 L 515,345 L 545,355 L 550,385 L 530,405 L 495,400 L 480,380 Z",
        center: [515, 375],
        name: "South Africa"
    },
    NG: {
        path: "M 445,235 L 470,228 L 485,240 L 480,265 L 460,275 L 440,265 L 438,248 Z",
        center: [460, 252],
        name: "Nigeria"
    },
    EG: {
        path: "M 500,180 L 530,175 L 545,190 L 540,215 L 520,225 L 495,215 L 492,195 Z",
        center: [520, 198],
        name: "Egypt"
    },
    SA: {
        path: "M 545,195 L 580,185 L 605,200 L 600,230 L 575,245 L 545,235 L 535,215 Z",
        center: [570, 215],
        name: "Saudi Arabia"
    },
    AE: {
        path: "M 590,210 L 610,205 L 622,215 L 618,230 L 602,235 L 588,228 Z",
        center: [605, 220],
        name: "UAE"
    },
    KR: {
        path: "M 838,145 L 850,140 L 858,150 L 855,165 L 845,170 L 835,162 L 835,152 Z",
        center: [846, 155],
        name: "South Korea"
    },
    SG: {
        path: "M 742,252 L 752,248 L 758,254 L 755,262 L 746,265 L 740,258 Z",
        center: [748, 256],
        name: "Singapore"
    },
    NL: {
        path: "M 448,100 L 458,96 L 464,102 L 462,112 L 454,116 L 446,110 Z",
        center: [455, 106],
        name: "Netherlands"
    },
    SE: {
        path: "M 472,65 L 485,55 L 495,65 L 492,90 L 480,100 L 468,92 L 465,75 Z",
        center: [480, 78],
        name: "Sweden"
    },
    PL: {
        path: "M 478,105 L 498,100 L 510,110 L 508,125 L 495,132 L 478,125 L 475,115 Z",
        center: [492, 116],
        name: "Poland"
    },
    IT: {
        path: "M 462,142 L 475,135 L 480,148 L 472,168 L 460,175 L 455,160 L 458,148 Z",
        center: [468, 155],
        name: "Italy"
    },
    ES: {
        path: "M 398,145 L 425,140 L 432,155 L 425,172 L 400,175 L 392,160 Z",
        center: [412, 158],
        name: "Spain"
    },
    TR: {
        path: "M 520,145 L 560,140 L 575,152 L 570,168 L 545,175 L 515,168 L 512,155 Z",
        center: [545, 158],
        name: "Turkey"
    },
    UA: {
        path: "M 508,108 L 540,102 L 555,115 L 550,132 L 528,140 L 505,132 L 502,118 Z",
        center: [528, 120],
        name: "Ukraine"
    },
    ID: {
        path: "M 745,265 L 800,258 L 840,268 L 845,285 L 820,295 L 770,295 L 745,282 Z",
        center: [795, 278],
        name: "Indonesia"
    },
    TH: {
        path: "M 725,215 L 738,205 L 748,218 L 742,242 L 728,252 L 718,238 L 720,222 Z",
        center: [733, 228],
        name: "Thailand"
    },
    PH: {
        path: "M 818,218 L 832,210 L 842,222 L 838,245 L 825,255 L 812,245 L 814,228 Z",
        center: [827, 232],
        name: "Philippines"
    },
    VN: {
        path: "M 752,200 L 765,192 L 775,205 L 770,235 L 758,248 L 748,235 L 750,212 Z",
        center: [762, 220],
        name: "Vietnam"
    },
    AR: {
        path: "M 220,340 L 245,325 L 260,345 L 255,405 L 235,445 L 210,440 L 205,390 L 212,355 Z",
        center: [232, 385],
        name: "Argentina"
    },
    CL: {
        path: "M 195,335 L 212,330 L 218,350 L 215,420 L 200,445 L 188,435 L 185,365 L 190,345 Z",
        center: [202, 388],
        name: "Chile"
    },
    CO: {
        path: "M 175,232 L 205,225 L 220,242 L 212,270 L 188,280 L 168,265 L 170,245 Z",
        center: [192, 252],
        name: "Colombia"
    },
    PE: {
        path: "M 168,275 L 195,268 L 208,288 L 200,325 L 175,335 L 158,318 L 162,290 Z",
        center: [182, 302],
        name: "Peru"
    },
    PK: {
        path: "M 620,165 L 650,158 L 665,172 L 658,195 L 635,205 L 615,195 L 612,178 Z",
        center: [638, 182],
        name: "Pakistan"
    },
    BD: {
        path: "M 698,195 L 715,188 L 725,200 L 720,218 L 705,225 L 692,215 L 694,202 Z",
        center: [708, 208],
        name: "Bangladesh"
    },
    IR: {
        path: "M 575,160 L 610,152 L 625,168 L 618,195 L 592,205 L 568,195 L 565,175 Z",
        center: [595, 178],
        name: "Iran"
    },
    IQ: {
        path: "M 552,168 L 575,162 L 585,178 L 578,198 L 558,205 L 545,195 L 548,180 Z",
        center: [565, 185],
        name: "Iraq"
    },
    MY: {
        path: "M 738,255 L 770,248 L 785,260 L 778,278 L 755,285 L 735,275 L 732,265 Z",
        center: [758, 268],
        name: "Malaysia"
    },
    KE: {
        path: "M 538,262 L 558,255 L 570,268 L 565,292 L 548,302 L 532,292 L 530,275 Z",
        center: [550, 278],
        name: "Kenya"
    },
    IL: {
        path: "M 525,178 L 535,175 L 540,185 L 535,200 L 525,205 L 518,195 L 520,182 Z",
        center: [528, 190],
        name: "Israel"
    },
};

interface IPMapProps {
    locations: GeoLocation[];
    className?: string;
}

export function IPGeolocationMap({ locations, className = "" }: IPMapProps) {
    // Filter out locations without valid coordinates
    const validLocations = useMemo(() =>
        locations.filter(loc => loc.lat !== 0 || loc.lng !== 0),
        [locations]
    );

    // Get unique detected country codes
    const detectedCountries = useMemo(() =>
        [...new Set(validLocations.map(loc => loc.countryCode.toUpperCase()))],
        [validLocations]
    );

    // Group locations by country for labels
    const locationsByCountry = useMemo(() => {
        const map = new Map<string, GeoLocation[]>();
        validLocations.forEach(loc => {
            const code = loc.countryCode.toUpperCase();
            if (!map.has(code)) map.set(code, []);
            map.get(code)!.push(loc);
        });
        return map;
    }, [validLocations]);

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
                    <span className="text-muted-foreground">IPs Detected</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-lg border">
                    <Globe className="w-4 h-4 text-red-400" />
                    <span className="font-medium">{detectedCountries.length}</span>
                    <span className="text-muted-foreground">Countries</span>
                </div>
                <div className="flex gap-1.5">
                    {detectedCountries.slice(0, 8).map(code => (
                        <span key={code} className="text-lg" title={COUNTRY_PATHS[code]?.name || code}>
                            {countryCodeToFlag(code)}
                        </span>
                    ))}
                </div>
            </div>

            {/* SVG World Map */}
            <div className="relative rounded-xl overflow-hidden border border-red-500/20 bg-gray-950" style={{ minHeight: "400px" }}>
                <svg
                    viewBox="0 0 1000 500"
                    className="w-full h-auto"
                    style={{ minHeight: "400px" }}
                >
                    {/* Definitions */}
                    <defs>
                        {/* Glow filter for highlighted countries */}
                        <filter id="countryGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        {/* Pulse glow for dots */}
                        <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Background grid */}
                    <g stroke="rgba(255,255,255,0.03)" strokeWidth="0.5">
                        {[...Array(10)].map((_, i) => (
                            <line key={`h${i}`} x1="0" y1={i * 50} x2="1000" y2={i * 50} />
                        ))}
                        {[...Array(20)].map((_, i) => (
                            <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="500" />
                        ))}
                    </g>

                    {/* All countries - dim outline */}
                    {Object.entries(COUNTRY_PATHS).map(([code, data]) => (
                        <path
                            key={code}
                            d={data.path}
                            fill="transparent"
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="0.5"
                        />
                    ))}

                    {/* Highlighted countries (detected) */}
                    {detectedCountries.map(code => {
                        const country = COUNTRY_PATHS[code];
                        if (!country) return null;

                        return (
                            <g key={`detected-${code}`}>
                                {/* Country fill with glow */}
                                <path
                                    d={country.path}
                                    fill="rgba(255,50,50,0.3)"
                                    stroke="#ff4444"
                                    strokeWidth="1.5"
                                    filter="url(#countryGlow)"
                                >
                                    <animate
                                        attributeName="fill-opacity"
                                        values="0.2;0.4;0.2"
                                        dur="2s"
                                        repeatCount="indefinite"
                                    />
                                </path>

                                {/* Pulsing dot at center */}
                                <circle
                                    cx={country.center[0]}
                                    cy={country.center[1]}
                                    r="8"
                                    fill="none"
                                    stroke="#ff4444"
                                    strokeWidth="2"
                                >
                                    <animate
                                        attributeName="r"
                                        values="6;15;6"
                                        dur="1.5s"
                                        repeatCount="indefinite"
                                    />
                                    <animate
                                        attributeName="opacity"
                                        values="1;0;1"
                                        dur="1.5s"
                                        repeatCount="indefinite"
                                    />
                                </circle>

                                {/* Main dot */}
                                <circle
                                    cx={country.center[0]}
                                    cy={country.center[1]}
                                    r="5"
                                    fill="#ff4444"
                                    filter="url(#dotGlow)"
                                >
                                    <animate
                                        attributeName="r"
                                        values="4;6;4"
                                        dur="1s"
                                        repeatCount="indefinite"
                                    />
                                </circle>

                                {/* White core */}
                                <circle
                                    cx={country.center[0]}
                                    cy={country.center[1]}
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

                                {/* Country label inside */}
                                <text
                                    x={country.center[0]}
                                    y={country.center[1] + 22}
                                    textAnchor="middle"
                                    fill="#ffffff"
                                    fontSize="11"
                                    fontWeight="bold"
                                    className="drop-shadow-lg"
                                >
                                    {code}
                                </text>
                                <text
                                    x={country.center[0]}
                                    y={country.center[1] + 34}
                                    textAnchor="middle"
                                    fill="rgba(255,100,100,0.9)"
                                    fontSize="9"
                                >
                                    {locationsByCountry.get(code)?.length || 0} IP{(locationsByCountry.get(code)?.length || 0) > 1 ? 's' : ''}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* IP Details List */}
            <div className="bg-muted/20 rounded-lg border divide-y divide-border/50 max-h-[200px] overflow-y-auto">
                {validLocations.map((loc, idx) => (
                    <div key={`${loc.ip}-${idx}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-red-500/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center">
                                <span className="animate-pulse">{idx + 1}</span>
                            </div>
                            <div>
                                <div className="font-mono text-sm text-white">{loc.ip}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
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
                            <div className="text-xs text-muted-foreground">{loc.country}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
