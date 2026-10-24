"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ArrowRight, Lock, Globe } from "lucide-react";

interface AuthJourneyCardProps {
    spf: string;
    dkim: string;
    dmarc: string;
    arcStatus: 'pass' | 'fail' | 'none';
    arcDetails: string[];
}

export function AuthJourneyCard({ spf, dkim, dmarc, arcStatus, arcDetails }: AuthJourneyCardProps) {

    // Extract Origin Info
    const originSpf = arcDetails.find(d => d.includes('Origin SPF:'))?.split(':')[1]?.trim().toLowerCase();
    const originDkim = arcDetails.find(d => d.includes('Origin DKIM:'))?.split(':')[1]?.trim().toLowerCase();

    const isArcValid = arcStatus === 'pass';
    const isFinalValid = spf === 'pass' && dkim === 'pass' && dmarc === 'pass';

    return (
        <Card className="bg-card/50 border-white/5">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="w-4 h-4" />
                    Authentication Journey
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between gap-2 text-xs">

                    {/* Origin Stage */}
                    <div className="flex flex-col items-center gap-2 text-center flex-1">
                        <div className={`p-2 rounded-full border ${isArcValid || (originSpf === 'pass') ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-muted border-white/10 text-muted-foreground'}`}>
                            <Globe className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                            <div className="font-medium text-foreground">Origin</div>
                            <div className="text-[10px] text-muted-foreground">
                                {isArcValid ? "ARC Signed" : "No ARC"}
                            </div>
                        </div>
                    </div>

                    {/* Transit */}
                    <div className="flex flex-col items-center gap-1 flex-1">
                        <ArrowRight className={`w-4 h-4 ${isArcValid ? 'text-green-500' : 'text-muted-foreground/30'}`} />
                        {isArcValid && <Badge variant="outline" className="text-[9px] h-4 px-1 bg-green-500/5 border-green-500/20 text-green-600">Trust Chain</Badge>}
                    </div>

                    {/* Final Stage */}
                    <div className="flex flex-col items-center gap-2 text-center flex-1">
                        <div className={`p-2 rounded-full border ${isFinalValid ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                            <Lock className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                            <div className="font-medium text-foreground">Destination</div>
                            <div className="text-[10px] text-muted-foreground">
                                {isFinalValid ? "Verified" : "Checks Failed"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2 bg-muted/20 p-2 rounded text-[11px] font-mono">
                    <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-muted-foreground">Origin SPF:</span>
                        <span className={originSpf === 'pass' ? 'text-green-500' : 'text-muted-foreground'}>{originSpf || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-muted-foreground">Origin DKIM:</span>
                        <span className={originDkim === 'pass' ? 'text-green-500' : 'text-muted-foreground'}>{originDkim || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                        <span className="text-muted-foreground">Final Verdict:</span>
                        <span className={(spf === 'pass' || dkim === 'pass') ? 'text-green-500' : 'text-amber-500'}>
                            {spf === 'pass' || dkim === 'pass' ? "ACCEPTED" : "QUARANTINE"}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
