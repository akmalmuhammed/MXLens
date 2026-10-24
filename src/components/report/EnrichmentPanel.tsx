"use client";

import { useEffect, useState } from "react";
import { fetchIPGeolocations } from "@/actions/geolocation";
import { IPGeolocationMap } from "@/components/analysis/IPGeolocationMap";
import { MxRecordCard } from "@/components/analysis/MxRecordCard";
import { ThreatIntelCard } from "@/components/analysis/ThreatIntelCard";
import type { GeoLocation } from "@/lib/threat-intel/geolocation";
import type { Report } from "@/lib/report/buildReport";
import { Panel } from "./primitives";

/**
 * Server-side reputation, geolocation and MX lookups. Only rendered when the
 * operator enabled enrichment; otherwise nothing here makes a request.
 */
export function EnrichmentPanel({ report, fromDomain }: { report: Report; fromDomain: string }) {
    const publicIps = report.ips.filter(ip => !ip.isPrivate).map(ip => ip.ip);
    const ipKey = publicIps.join(",");
    const [locations, setLocations] = useState<GeoLocation[]>([]);

    useEffect(() => {
        if (!ipKey) return;
        let cancelled = false;
        fetchIPGeolocations(ipKey.split(","))
            .then(result => {
                if (!cancelled) setLocations(result);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [ipKey]);

    return (
        <Panel id="enrichment" index="08" title="Reputation and infrastructure" className="no-print">
            <div className="space-y-4">
                <ThreatIntelCard
                    ips={publicIps}
                    domains={report.domains}
                    hashes={report.attachments.map(a => a.sha256).filter(Boolean)}
                />
                <div className="grid gap-4 lg:grid-cols-2">
                    <MxRecordCard domain={fromDomain} rawFrom={report.message.from} />
                    {locations.length > 0 && <IPGeolocationMap locations={locations} />}
                </div>
            </div>
        </Panel>
    );
}
