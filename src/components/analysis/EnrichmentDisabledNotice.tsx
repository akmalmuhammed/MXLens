import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

/**
 * Shown in place of a lookup that needs enrichment. Enrichment sends indicators
 * to third parties, so it is opt-in for whoever runs the server.
 */
export function EnrichmentDisabledNotice({ feature }: { feature: string }) {
    return (
        <Card className="bg-card/50 border-white/5 border-dashed">
            <CardContent className="p-4 text-xs text-muted-foreground flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                    {feature} needs external lookups, which are off. Self-hosters can enable them with{" "}
                    <code className="font-mono">MXLENS_ENRICHMENT=true</code>. Indicators (IPs, domains, file hashes) are
                    then sent to third-party reputation services.
                </span>
            </CardContent>
        </Card>
    );
}
