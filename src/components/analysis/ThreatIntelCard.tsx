"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldAlert, ShieldCheck, ExternalLink, Loader2, AlertTriangle, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { checkThreatIntel } from "@/actions/threat-intel";
import { ThreatIntelResult } from "@/lib/threat-intel/virustotal";

interface ThreatIntelCardProps {
    ips: string[];
    domains: string[];
    hashes?: string[];
}

export const ThreatIntelCard = ({ ips, domains, hashes = [] }: ThreatIntelCardProps) => {
    const [results, setResults] = useState<ThreatIntelResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        const scan = async () => {
            // Only scan if we haven't already and there are targets
            if (scanned || (ips.length === 0 && domains.length === 0 && hashes.length === 0)) {
                setLoading(false);
                return;
            }

            try {
                const targets: { type: 'ip' | 'domain' | 'hash', value: string }[] = [
                    ...ips.map(ip => ({ type: 'ip' as const, value: ip })),
                    ...domains.map(d => ({ type: 'domain' as const, value: d })),
                    ...hashes.map(h => ({ type: 'hash' as const, value: h }))
                ];

                const uniqueTargets = Array.from(new Set(targets.map(t => JSON.stringify(t))))
                    .map(s => JSON.parse(s))
                    .slice(0, 10); // Limit to top 10

                const data = await checkThreatIntel(uniqueTargets);
                setResults(data);
            } catch (err) {
                console.error("Threat intel scan failed", err);
            } finally {
                setLoading(false);
                setScanned(true);
            }
        };

        scan();
    }, [ips, domains, hashes, scanned]);

    // Determine aggregate status
    const maliciousCount = results.filter(r => r.verdict === 'malicious').length;
    const suspiciousCount = results.filter(r => r.verdict === 'suspicious').length;
    const cleanCount = results.filter(r => r.verdict === 'clean').length;

    let aggregateStatus: "secure" | "warning" | "danger" = "secure";
    if (maliciousCount > 0) aggregateStatus = "danger";
    else if (suspiciousCount > 0) aggregateStatus = "warning";

    const statusColors = {
        secure: "text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]",
        warning: "text-amber-400 border-amber-500/30 shadow-[0_0_20px_rgba(251,191,36,0.1)]",
        danger: "text-red-500 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
    };

    return (
        <Card className={`relative overflow-hidden bg-black/40 backdrop-blur-xl border ${aggregateStatus === 'danger' ? 'border-red-500/40' : 'border-white/10'}`}>
            {/* Cyberpunk Grid Background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}
            />

            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-white/5 border border-white/10 ${aggregateStatus === 'danger' ? 'text-red-500 animate-pulse' : 'text-primary'
                            }`}>
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold tracking-tight">Threat Intelligence</CardTitle>
                            <CardDescription className="text-xs font-mono text-muted-foreground">VIRUSTOTAL • PHISHTANK • URLHAUS • ABUSEIPDB</CardDescription>
                        </div>
                    </div>
                    <Badge variant="outline" className={`font-mono uppercase ${statusColors[aggregateStatus]}`}>
                        {loading ? "Scanning..." : aggregateStatus}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground animate-pulse">Querying global threat databases...</p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No actionable threat data found for extracted entities.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {results.map((result, i) => (
                            <motion.div
                                key={`${result.provider}-${result.target}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="group flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-primary/30 transition-all"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {result.verdict === 'malicious' ? (
                                        <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                                    ) : result.verdict === 'suspicious' ? (
                                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                    ) : (
                                        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                                    )}

                                    <div className="flex flex-col overflow-hidden">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium truncate text-foreground/90 font-mono" title={result.target}>
                                                {result.target}
                                            </span>
                                            {result.domainAge && (
                                                <Badge variant="outline" className={`text-[10px] px-1.5 h-4 ${result.domainAge.days < 30 ? 'border-red-500/50 text-red-400 bg-red-500/10' : 'border-emerald-500/30 text-emerald-400'
                                                    }`}>
                                                    {result.domainAge.days < 30 ? 'FRESH' : `${Math.floor(result.domainAge.days / 365)}Y`}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="uppercase text-[10px] font-bold bg-white/5 px-1 rounded">{result.provider}</span>

                                            {result.domainAge ? (
                                                <span>Created {new Date(result.domainAge.createdDate).toLocaleDateString()} ({result.domainAge.days}d ago)</span>
                                            ) : result.provider === 'VirusTotal' ? (
                                                <span className={result.stats.malicious > 0 ? "text-red-400 font-bold" : "text-emerald-400"}>
                                                    {result.stats.malicious}/{result.stats.malicious + result.stats.harmless} Engines
                                                </span>
                                            ) : (
                                                <span className={result.verdict === 'malicious' ? "text-red-400 font-bold" : "text-emerald-400"}>
                                                    Score: {result.reputation}/100
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                    <a href={
                                        result.provider === 'VirusTotal' ? `https://www.virustotal.com/gui/${result.type === 'ip' ? 'ip-address' : 'domain'}/${result.target}` :
                                            result.provider === 'AbuseIPDB' ? `https://www.abuseipdb.com/check/${result.target}` :
                                                result.provider === 'PhishTank' ? `https://www.phishtank.com/` :
                                                    result.provider === 'URLhaus' ? `https://urlhaus.abuse.ch/browse/search/?search=${result.target}` :
                                                        result.provider === 'GoogleSafeBrowsing' ? `https://transparencyreport.google.com/safe-browsing/search?url=${result.target}` :
                                                            `https://who.is/whois/${result.target}`
                                    } target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
