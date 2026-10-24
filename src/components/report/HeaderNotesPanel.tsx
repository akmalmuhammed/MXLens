import type { Report } from "@/lib/report/buildReport";
import { Panel } from "./primitives";

/** Vendor X- headers worth a look, such as an upstream spam verdict. */
export function HeaderNotesPanel({ report }: { report: Report }) {
    if (report.headerNotes.length === 0) return null;

    return (
        <Panel title="Header notes">
            <dl className="space-y-3">
                {report.headerNotes.map(note => (
                    <div key={`${note.key}-${note.value}`}>
                        <dt className="font-mono text-[11px] text-sev-info">{note.key}</dt>
                        <dd className="mt-0.5 break-all font-mono text-[12px] text-foreground/85">{note.value}</dd>
                        {note.explanation && <dd className="mt-0.5 text-xs text-muted-foreground">{note.explanation}</dd>}
                    </div>
                ))}
            </dl>
        </Panel>
    );
}
