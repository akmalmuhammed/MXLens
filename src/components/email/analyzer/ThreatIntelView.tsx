import { ThreatIntelCard } from "@/components/analysis/ThreatIntelCard";
import { InfrastructureCard } from "@/components/analysis/InfrastructureCard";
import { LinkAnalysisCard } from "@/components/analysis/LinkAnalysisCard";
import { IPGeolocationMap } from "@/components/analysis/IPGeolocationMap";
import { GeoLocation } from "@/lib/threat-intel/geolocation";
import { AnalysisResult } from "@/lib/email/HeaderParser";
import { NormalizedSignals } from "@/lib/email/scoring/types";
import { Globe, ShieldAlert, Network, FileSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ThreatIntelViewProps {
    analysis: {
        header: AnalysisResult;
        signals: NormalizedSignals;
    };
    ipLocations: GeoLocation[];
    loadingGeo: boolean;
}

export function ThreatIntelView({ analysis, ipLocations, loadingGeo }: ThreatIntelViewProps) {
    const uniqueIps = analysis.header.artifacts
        .filter(a => a.type === 'ip')
        .map(a => a.value)
        .filter((v, i, a) => a.indexOf(v) === i);

    const uniqueDomains = [
        analysis.signals.fromDomain,
        ...analysis.signals.extractedUrls.map(u => {
            try { return new URL(u).hostname; } catch { return ""; }
        })
    ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

    const hashes = analysis.signals.attachments.map(a => a.sha256).filter(Boolean) as string[];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
                        <Globe className="w-6 h-6 text-primary" />
                        Global Threat Intelligence
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Correlated infrastructure data, reputation scores, and IOC analysis.
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-card border px-4 py-2 rounded-lg flex flex-col items-center">
                        <span className="text-[10px] uppercase text-muted-foreground font-bold">Unique IPs</span>
                        <span className="font-mono font-bold text-lg">{uniqueIps.length}</span>
                    </div>
                    <div className="bg-card border px-4 py-2 rounded-lg flex flex-col items-center">
                        <span className="text-[10px] uppercase text-muted-foreground font-bold">Domains</span>
                        <span className="font-mono font-bold text-lg">{uniqueDomains.length}</span>
                    </div>
                </div>
            </div>

            {/* Network Infrastructure Layer */}
            <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-semibold text-lg text-foreground/90">
                    <Network className="w-5 h-5 text-blue-500" />
                    Global Infrastructure Map
                </h3>
                {/* Full Width Map */}
                <div className="bg-card border rounded-xl p-1 shadow-sm h-[500px] w-full relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/5 pointer-events-none z-10" />
                    <IPGeolocationMap locations={ipLocations} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <InfrastructureCard
                        fromDomain={analysis.signals.fromDomain}
                        ipLocations={ipLocations}
                        loading={loadingGeo}
                    />
                </div>
                <div className="space-y-6">
                    <ThreatIntelCard
                        ips={uniqueIps}
                        domains={uniqueDomains}
                        hashes={hashes}
                    />
                </div>
            </div>

            {/* IOC Deep Dive */}
            <div className="space-y-4 pt-4 border-t border-dashed">
                <h3 className="flex items-center gap-2 font-semibold text-lg text-foreground/90">
                    <FileSearch className="w-5 h-5 text-orange-500" />
                    Deep Indicator Analysis
                </h3>

                <div className="grid grid-cols-1 gap-6">
                    <LinkAnalysisCard links={analysis.signals.urlAnalysis || []} />
                </div>
            </div>
        </div>
    );
}
