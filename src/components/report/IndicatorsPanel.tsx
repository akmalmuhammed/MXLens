"use client";

import { Switch } from "@/components/ui/switch";
import { defang, type Report } from "@/lib/report/buildReport";
import { CopyButton, Eyebrow, Panel } from "./primitives";

interface Group {
    label: string;
    values: string[];
}

export function indicatorGroups(report: Report, defanged: boolean): Group[] {
    const d = (value: string) => (defanged ? defang(value) : value);
    return [
        { label: "Domains", values: report.domains.map(d) },
        { label: "Public IPs", values: report.ips.filter(ip => !ip.isPrivate).map(ip => d(ip.ip)) },
        { label: "URLs", values: report.links.map(link => d(link.url)) },
        { label: "SHA-256", values: report.attachments.map(file => file.sha256).filter(Boolean) },
    ].filter(group => group.values.length > 0);
}

export function IndicatorsPanel({
    report,
    defanged,
    onDefangedChange,
}: {
    report: Report;
    defanged: boolean;
    onDefangedChange: (value: boolean) => void;
}) {
    const groups = indicatorGroups(report, defanged);
    const all = groups.flatMap(group => group.values).join("\n");
    const total = groups.reduce((sum, group) => sum + group.values.length, 0);

    return (
        <Panel
            id="indicators"
            title="Indicators"
            aside={total > 0 && <CopyButton value={all} label={`Copy all ${total}`} />}
        >
            <label className="no-print mb-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>
                    Defang for sharing <span className="font-mono">(hxxp, [.])</span>
                </span>
                <Switch checked={defanged} onCheckedChange={onDefangedChange} aria-label="Defang indicators" />
            </label>

            {groups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No indicators extracted.</p>
            ) : (
                <div className="space-y-3">
                    {groups.map(group => (
                        <div key={group.label}>
                            <div className="mb-1 flex items-center justify-between">
                                <Eyebrow>{group.label}</Eyebrow>
                                <span className="font-mono text-[11px] text-muted-foreground">{group.values.length}</span>
                            </div>
                            <ul className="space-y-0.5">
                                {group.values.map(value => (
                                    <li key={value} className="group flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-foreground/[0.04]">
                                        <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-foreground/85" title={value}>{value}</code>
                                        <CopyButton value={value} label="Copy" iconOnly className="opacity-60 group-hover:opacity-100" />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </Panel>
    );
}
