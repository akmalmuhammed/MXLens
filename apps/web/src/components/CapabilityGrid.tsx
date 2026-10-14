import { listRules } from "@mxlens/engine";

/**
 * A bento of what MXLens actually does. Every figure here is a true property of
 * the engine (rule count, checks, exports), not a fabricated metric.
 */
export function CapabilityGrid() {
    const ruleCount = listRules().length;
    return (
        <section className="wrap" style={{ paddingBottom: 8 }}>
            <div className="sec-head">
                <h2>What it inspects</h2>
                <p>Every signal, explained — not a black-box score.</p>
            </div>
            <div className="bento">
                <div className="tile b2 lift">
                    <div className="t-label">Detection rules</div>
                    <div className="t-big">{ruleCount}</div>
                    <div className="t-sub">Each finding names the evidence it saw and the MITRE ATT&amp;CK technique it maps to.</div>
                </div>
                <div className="tile b4 lift">
                    <h3>Sender authentication, done right</h3>
                    <p>SPF, DKIM and DMARC alignment computed against the organizational domain via the Public Suffix List, and ARC-aware so forwarded mail and mailing lists aren&apos;t misread. A spoofed address hidden in a display name can&apos;t fool the parser.</p>
                    <div className="caps" style={{ marginTop: 14 }}>
                        <span className="cap">SPF</span><span className="cap">DKIM</span><span className="cap">DMARC</span><span className="cap">ARC</span><span className="cap">alignment</span>
                    </div>
                </div>
                <div className="tile b3 lift">
                    <h3>Links &amp; lookalikes</h3>
                    <p>Homograph and punycode domains, typo- and combosquats, brand-decoy hostnames, open redirects, shorteners, raw-IP links, and credential forms.</p>
                </div>
                <div className="tile b3 lift">
                    <h3>Attachments &amp; content</h3>
                    <p>Disguised and double-extension files, macro and HTML-smuggling payloads, encrypted archives, and call-back (phone) scams — by content, not just file name.</p>
                </div>
                <div className="tile b2 lift">
                    <div className="t-label">Exports</div>
                    <div className="t-sub" style={{ marginTop: 14, fontSize: 14 }}>Ticket-ready Markdown, JSON, CSV, and <b style={{ color: "var(--text)" }}>STIX 2.1</b> — indicators defanged on the way out.</div>
                </div>
                <div className="tile b4 lift">
                    <h3>Runs where you work</h3>
                    <p>The same engine powers this browser app (nothing uploaded), a CLI with exit codes for pipelines, a REST API, and an MCP server so an AI agent can triage mail locally.</p>
                    <div className="caps" style={{ marginTop: 14 }}>
                        <span className="cap">Browser</span><span className="cap">CLI</span><span className="cap">REST</span><span className="cap">MCP</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
