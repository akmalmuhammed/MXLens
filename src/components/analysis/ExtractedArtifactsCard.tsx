"use client";

import { Copy, ShieldAlert, Globe, Link2, FileKey, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttachmentSignal } from "@/lib/email/scoring/types";

interface ExtractedArtifactsCardProps {
    ips: string[];
    urls: string[];
    attachments: AttachmentSignal[];
    fromDomain?: string;
}

export function ExtractedArtifactsCard({ ips, urls, attachments, fromDomain }: ExtractedArtifactsCardProps) {
    const hasArtifacts = ips.length > 0 || urls.length > 0 || attachments.length > 0 || fromDomain;

    if (!hasArtifacts) return null;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="border rounded-xl p-0 bg-card/50 shadow-sm overflow-hidden">
            <div className="bg-muted/30 px-4 py-3 border-b flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                    <FileKey className="w-4 h-4 text-primary" />
                    Extracted Artifacts
                </h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full border">
                    {ips.length + urls.length + attachments.length + (fromDomain ? 1 : 0)} items
                </span>
            </div>

            <div className="divide-y">
                {/* 1. Network Indicators (IPs & Domains) */}
                {(ips.length > 0 || fromDomain) && (
                    <div className="p-4">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                            <Globe className="w-3 h-3" /> Network Indicators
                        </h4>
                        <div className="space-y-2">
                            {/* IPs */}
                            {ips.map((ip, idx) => (
                                <ArtifactRow
                                    key={`ip-${idx}`}
                                    value={ip}
                                    label="Source IP"
                                    type="ip"
                                    onCopy={copyToClipboard}
                                    actions={[
                                        { title: "VirusTotal IP", url: `https://www.virustotal.com/gui/ip-address/${ip}`, icon: ShieldAlert, color: "text-red-500" },
                                        { title: "URLhaus Lookup", url: `https://urlhaus.abuse.ch/browse/search/?search=${ip}`, icon: ShieldAlert, color: "text-amber-500" },
                                        { title: "IP Geolocation", url: `https://ipinfo.io/${ip}`, icon: Globe, color: "text-blue-500" }
                                    ]}
                                />
                            ))}
                            {/* Sender Domain */}
                            {fromDomain && (
                                <ArtifactRow
                                    key="domain"
                                    value={fromDomain}
                                    label="Sender Domain"
                                    type="domain"
                                    onCopy={copyToClipboard}
                                    actions={[
                                        { title: "VirusTotal Domain", url: `https://www.virustotal.com/gui/domain/${fromDomain}`, icon: ShieldAlert, color: "text-orange-500" },
                                        { title: "URLhaus Lookup", url: `https://urlhaus.abuse.ch/browse/search/?search=${fromDomain}`, icon: ShieldAlert, color: "text-amber-500" },
                                        { title: "Whois Lookup", url: `https://who.is/whois/${fromDomain}`, icon: Link2, color: "text-blue-400" }
                                    ]}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* 2. URLs & Links */}
                {urls.length > 0 && (
                    <div className="p-4">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                            <Link2 className="w-3 h-3" /> Suspicious Links
                        </h4>
                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                            {urls.map((url, idx) => {
                                try {
                                    const domain = new URL(url).hostname;
                                    return (
                                        <ArtifactRow
                                            key={`url-${idx}`}
                                            value={url}
                                            label={domain}
                                            type="url"
                                            onCopy={copyToClipboard}
                                            truncate
                                            actions={[
                                                { title: "VirusTotal URL", url: `https://www.virustotal.com/gui/url/${btoa(url).replace(/=/g, '')}`, icon: ShieldAlert, color: "text-red-500" },
                                                { title: "PhishTank Search", url: `https://www.phishtank.com/phish_search.php?phish_q=${encodeURIComponent(url)}`, icon: ShieldAlert, color: "text-blue-500" },
                                                { title: "URLhaus Lookup", url: `https://urlhaus.abuse.ch/browse/search/?search=${encodeURIComponent(url)}`, icon: ShieldAlert, color: "text-amber-500" },
                                                { title: "URLScan", url: `https://urlscan.io/`, icon: ExternalLink, color: "text-green-500" }
                                            ]}
                                        />
                                    );
                                } catch {
                                    return null;
                                }
                            })}
                        </div>
                    </div>
                )}

                {/* 3. File Hashes */}
                {attachments.length > 0 && (
                    <div className="p-4">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                            <FileKey className="w-3 h-3" /> File Hashes (SHA-256)
                        </h4>
                        <div className="space-y-2">
                            {attachments.map((att, idx) => att.sha256 ? (
                                <ArtifactRow
                                    key={`hash-${idx}`}
                                    value={att.sha256}
                                    label={`${att.filename} (${(att.size / 1024).toFixed(1)} KB)`}
                                    type="hash"
                                    onCopy={copyToClipboard}
                                    actions={[
                                        { title: "VirusTotal Hash", url: `https://www.virustotal.com/gui/file/${att.sha256}`, icon: ShieldAlert, color: "text-red-500" },
                                        { title: "URLhaus Lookup", url: `https://urlhaus.abuse.ch/browse/search/?search=${att.sha256}`, icon: ShieldAlert, color: "text-amber-500" }
                                    ]}
                                />
                            ) : null)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

interface Action {
    title: string;
    url: string;
    icon: any;
    color: string;
}

interface ArtifactRowProps {
    value: string;
    label?: string;
    type: string;
    onCopy: (text: string) => void;
    actions: Action[];
    truncate?: boolean;
}

function ArtifactRow({ value, label, type, onCopy, actions, truncate }: ArtifactRowProps) {
    return (
        <div className="flex items-center justify-between text-sm bg-muted/10 p-2 rounded border group hover:bg-muted/30 transition-colors">
            <div className="flex flex-col min-w-0 flex-1 mr-2">
                <span className={`font-mono text-xs text-foreground/90 ${truncate ? 'truncate' : 'break-all'}`} title={value}>
                    {value}
                </span>
                {label && <span className="text-[10px] text-muted-foreground truncate font-medium">{label}</span>}
            </div>

            <div className="flex items-center gap-1 opacity-100 shrink-0">
                {actions.map((link, i) => (
                    <Button
                        key={i}
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-background border border-transparent hover:border-border shadow-sm"
                        title={link.title}
                        onClick={() => window.open(link.url, '_blank')}
                    >
                        <link.icon className={`h-3 w-3 ${link.color}`} />
                    </Button>
                ))}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-background border border-transparent hover:border-border shadow-sm"
                    title="Copy Value"
                    onClick={() => onCopy(value)}
                >
                    <Copy className="h-3 w-3 text-muted-foreground" />
                </Button>
            </div>
        </div>
    );
}
