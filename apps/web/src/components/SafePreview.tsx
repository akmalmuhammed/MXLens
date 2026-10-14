"use client";

import { useMemo, useState } from "react";

/**
 * Renders an email's HTML body for inspection without letting it do anything.
 * The HTML goes into a fully sandboxed iframe (no scripts, no same-origin, no
 * forms, no top-navigation) with a restrictive CSP that blocks all network
 * loads, so remote images and trackers never fire. Links are shown but inert.
 */
export function SafePreview({ html }: { html: string }) {
    const [reveal, setReveal] = useState(false);

    const srcDoc = useMemo(() => {
        const csp = "default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:;";
        return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><base target="_blank"><style>body{font-family:system-ui,sans-serif;margin:14px;color:#111;background:#fff;word-break:break-word}a{pointer-events:none}img{max-width:100%}</style></head><body>${html}</body></html>`;
    }, [html]);

    if (!reveal) {
        return (
            <div className="preview-note" style={{ borderBottom: 0, padding: "24px 16px", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
                <span>The HTML body is rendered in a locked sandbox with all network loads blocked, so remote images and trackers cannot fire. Links are shown but disabled.</span>
                <button className="btn sm" onClick={() => setReveal(true)}>Render HTML safely</button>
            </div>
        );
    }

    return (
        <>
            <div className="preview-note">Sandboxed · scripts disabled · remote content blocked · links inert</div>
            <iframe
                className="safeframe"
                sandbox=""
                srcDoc={srcDoc}
                title="Safe email preview"
                referrerPolicy="no-referrer"
            />
        </>
    );
}
