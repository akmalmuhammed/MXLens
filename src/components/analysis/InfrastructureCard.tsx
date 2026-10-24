"use client";

import { useEffect, useState } from "react";
import { InfrastructureAnalyzer, InfrastructureVerdict } from "@/lib/email/analysis/InfrastructureAnalyzer";
import { GeoLocation } from "@/lib/threat-intel/geolocation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Network } from "lucide-react";

interface InfrastructureCardProps {
    fromDomain: string;
    ipLocations: GeoLocation[];
    loading: boolean;
}

export function InfrastructureCard({ fromDomain, ipLocations, loading }: InfrastructureCardProps) {
    const [verdict, setVerdict] = useState<InfrastructureVerdict | null>(null);

    useEffect(() => {
        if (loading || ipLocations.length === 0 || !fromDomain) return;

        // Check the primary IP (first hop)
        const primaryIp = ipLocations[0];
        if (primaryIp && primaryIp.org) {
            const result = InfrastructureAnalyzer.validate(fromDomain, primaryIp.org);
            setVerdict(result);
        }
    }, [fromDomain, ipLocations, loading]);

    if (loading) {
        return (
            <Card className="bg-muted/10 border-white/5 animate-pulse">
                <CardHeader className="pb-2">
                    <div className="h-5 w-32 bg-white/10 rounded" />
                </CardHeader>
                <CardContent>
                    <div className="h-4 w-full bg-white/5 rounded mb-2" />
                    <div className="h-4 w-2/3 bg-white/5 rounded" />
                </CardContent>
            </Card>
        );
    }

    if (!verdict) return null;

    // Default to NEUTRAL/PASS style if neutral
    const isPass = verdict.status === 'PASS' || verdict.status === 'NEUTRAL';
    const isCritical = verdict.riskLevel === 'CRITICAL';

    return (
        <Card className={`relative overflow-hidden backdrop-blur-sm border ${isPass ? 'bg-green-500/10 border-green-500/20' :
            isCritical ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/20'
            }`}>
            {/* Background Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent)', backgroundSize: '30px 30px' }}
            />

            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                        <Network className="w-4 h-4" />
                        Infrastructure Trust Chain
                    </CardTitle>
                    <Badge variant="outline" className={`font-mono ${isPass ? 'text-green-400 border-green-500/30' : 'text-red-400 border-red-500/40 bg-red-500/10'
                        }`}>
                        {isPass ? 'VERIFIED' : 'BROKEN'}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent>
                <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg border shrink-0 ${isPass ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-500'
                        }`}>
                        {isPass ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6 animate-pulse" />}
                    </div>

                    <div>
                        <h4 className={`font-bold text-lg mb-1 ${isPass ? 'text-foreground' : 'text-red-400'}`}>
                            {verdict.status === 'NEUTRAL' ? 'Standard Infrastructure' : (isPass ? 'Authorized Infrastructure' : 'Infrastructure Mismatch')}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {verdict.details}
                        </p>

                        {!isPass && (
                            <div className="mt-3 text-xs bg-red-500/5 border border-red-500/10 p-2 rounded text-red-300/80">
                                <strong>Why this matters:</strong> {verdict.brand} emails typically originate from {verdict.brand} servers.
                                Seeing traffic from "Digital Ocean" or residential IPs is a strong indicator of phishing.
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
