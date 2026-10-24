import { Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { defang, type Report } from "@/lib/report/buildReport";
import { CopyButton, EmptyLine, Panel, Pill } from "./primitives";

export function LinksPanel({ report, defanged }: { report: Report; defanged: boolean }) {
    const { links } = report;
    const risky = links.filter(l => l.risky).length;

    return (
        <Panel
            id="links"
            index="04"
            title="Links"
            aside={links.length > 0 && <span className="font-mono text-[11px] text-muted-foreground">{risky} flagged · {links.length} total</span>}
        >
            {!report.scope.body ? (
                <EmptyLine>Turn on body analysis to extract and check links.</EmptyLine>
            ) : links.length === 0 ? (
                <EmptyLine>No links in the message body.</EmptyLine>
            ) : (
                <ul className="divide-y divide-hairline">
                    {links.map(link => (
                        <li key={link.url} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                            <Link2 className={cn("mt-0.5 h-4 w-4 shrink-0", link.risky ? "text-sev-high" : "text-muted-foreground")} />
                            <div className="min-w-0 flex-1">
                                <p className="break-all font-mono text-[12.5px] leading-relaxed text-foreground/90">
                                    {defanged ? defang(link.url) : link.url}
                                </p>
                                {link.flags.length > 0 && (
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {link.flags.map(flag => (
                                            <Pill key={flag} className="border-sev-high/30 bg-sev-high/10 normal-case tracking-normal text-sev-high">{flag}</Pill>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <CopyButton value={defanged ? defang(link.url) : link.url} label="Copy link" iconOnly />
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    );
}
