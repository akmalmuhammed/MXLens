"use client";

import { useMemo, useState } from "react";
import { EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { SafeSanitizer } from "@/lib/email/sanitizer";
import { CopyButton, Panel } from "./primitives";

type View = "preview" | "text" | "html" | "headers";

export function ContentPanel({
    html,
    text,
    rawHeaders,
}: {
    html: string;
    text: string;
    rawHeaders: string;
}) {
    const views = useMemo(() => {
        const list: { id: View; label: string }[] = [];
        if (html) list.push({ id: "preview", label: "Preview" });
        if (text) list.push({ id: "text", label: "Text" });
        if (html) list.push({ id: "html", label: "HTML source" });
        list.push({ id: "headers", label: "Headers" });
        return list;
    }, [html, text]);

    const [view, setView] = useState<View>(views[0].id);
    const active = views.some(v => v.id === view) ? view : views[0].id;

    const safeHtml = useMemo(() => (html ? SafeSanitizer.sanitize(html, { blockImages: true, disableLinks: true }) : ""), [html]);
    const copyValue = active === "text" ? text : active === "html" ? html : active === "headers" ? rawHeaders : "";

    return (
        <Panel
            id="content"
            index="07"
            title="Message"
            aside={copyValue && <CopyButton value={copyValue} label="Copy" />}
        >
            <div role="tablist" aria-label="Message views" className="no-print mb-3 inline-flex rounded-lg border border-hairline p-0.5">
                {views.map(v => (
                    <button
                        key={v.id}
                        type="button"
                        role="tab"
                        aria-selected={active === v.id}
                        onClick={() => setView(v.id)}
                        className={cn(
                            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                            active === v.id ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {v.label}
                    </button>
                ))}
            </div>

            {active === "preview" && (
                <div className="overflow-hidden rounded-lg border border-hairline">
                    <div className="flex items-center gap-2 border-b border-hairline bg-foreground/[0.03] px-3 py-1.5 text-[11px] text-muted-foreground">
                        <EyeOff className="h-3.5 w-3.5" />
                        Sandboxed. Scripts, forms, links and remote images are disabled.
                    </div>
                    <iframe
                        title="Sandboxed email preview"
                        sandbox=""
                        className="h-[480px] w-full bg-white"
                        srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;font-size:14px;margin:0;padding:16px;color:#1f2937;word-wrap:break-word}</style></head><body>${safeHtml}</body></html>`}
                    />
                </div>
            )}

            {active !== "preview" && (
                <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap break-all rounded-lg border border-hairline bg-foreground/[0.03] p-3 font-mono text-[12px] leading-relaxed text-foreground/85">
                    {active === "text" ? text : active === "html" ? html : rawHeaders}
                </pre>
            )}
        </Panel>
    );
}
