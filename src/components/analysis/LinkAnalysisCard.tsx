"use client";

import { AlertTriangle, Link2, Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface LinkAnalysis {
    href: string;
    display: string;
    isMismatched: boolean;
    isSubdomainTrick: boolean;
    isLookalike: boolean;
    riskScore: number;
    details: string[];
}

interface LinkAnalysisCardProps {
    links: LinkAnalysis[];
}

export function LinkAnalysisCard({ links }: LinkAnalysisCardProps) {
    const suspiciousLinks = links.filter(l => l.riskScore > 0);
    const totalLinks = links.length;

    if (totalLinks === 0) return null;
    if (suspiciousLinks.length === 0) return null;

    return (
        <Card className="border-amber-500/20 bg-amber-500/5 overflow-hidden">
            <CardHeader className="pb-3 border-b border-amber-500/10">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-amber-500">
                        <AlertTriangle className="w-4 h-4" />
                        Deceptive Links Detected
                    </CardTitle>
                    <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10">
                        {suspiciousLinks.length} SUSPICIOUS
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                    {suspiciousLinks.map((link, idx) => (
                        <AccordionItem key={idx} value={`item-${idx}`} className="border-b border-amber-500/10 last:border-0">
                            <AccordionTrigger className="px-4 py-3 hover:bg-amber-500/10 transition-colors">
                                <div className="flex items-start gap-3 text-left">
                                    <div className="mt-0.5 bg-amber-500/10 p-1.5 rounded text-amber-500">
                                        <Link2 className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-mono text-xs text-amber-400 font-semibold mb-1">
                                            {link.details[0]}
                                        </div>
                                        <div className="text-sm text-muted-foreground line-clamp-1">
                                            "{link.display}"
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4 bg-black/20">
                                <div className="space-y-3 pt-2">
                                    <div className="grid grid-cols-[80px_1fr] gap-2 text-xs">
                                        <span className="text-muted-foreground uppercase tracking-wide font-medium">Display:</span>
                                        <code className="bg-white/5 px-2 py-0.5 rounded text-foreground break-all">
                                            {link.display}
                                        </code>

                                        <span className="text-muted-foreground uppercase tracking-wide font-medium">Actual:</span>
                                        <code className="bg-red-500/10 px-2 py-0.5 rounded text-red-400 break-all border border-red-500/20">
                                            {link.href}
                                        </code>
                                    </div>

                                    {link.isLookalike && (
                                        <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                                            <Search className="w-3 h-3" />
                                            Typosquatting detected: Text resembles a known brand.
                                        </div>
                                    )}

                                    {link.isSubdomainTrick && (
                                        <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                                            <AlertTriangle className="w-3 h-3" />
                                            Subdomain Trick detected: Brand name used in subdomain directly.
                                        </div>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
}
