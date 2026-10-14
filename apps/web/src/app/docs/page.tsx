import type { Metadata } from "next";
import { listRules } from "@mxlens/engine";
import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = { title: "Docs — MXLens", description: "Use MXLens from the browser, the CLI, the REST API or an AI agent, and see every detection rule." };

export default function Docs() {
    const rules = listRules();
    return (
        <>
            <TopBar />
            <main className="wrap prose">
                <h1>Documentation</h1>
                <p>MXLens analyzes a raw email and returns a verdict, a risk score, explained findings and extracted indicators. There are four ways to run it, all on the same engine.</p>

                <h2>In the browser</h2>
                <p>Open the <a href="/">analyzer</a>, drop an <code>.eml</code> file or paste the raw source, and read the result. Nothing is uploaded.</p>

                <h2>Command line</h2>
                <pre><code>{`npm install -g mxlens

mxlens suspicious.eml            # human-readable report
mxlens *.eml --format json       # machine-readable
cat mail.eml | mxlens - -q       # quiet: verdict only
mxlens report.eml -f stix        # STIX 2.1 indicators`}</code></pre>
                <p>The CLI exits <code>1</code> when a message reaches the fail threshold (<code>malicious</code> by default, set with <code>--fail-on</code>), so it drops into scripts and pipelines.</p>

                <h2>REST API</h2>
                <pre><code>{`curl -X POST https://mx-lens.vercel.app/api/v1/analyze \\
  -H "content-type: message/rfc822" \\
  --data-binary @suspicious.eml`}</code></pre>
                <p>Or send JSON: <code>{`{ "email": "<raw>", "trustedAuthservIds": ["mx.example.org"] }`}</code>. Add <code>?format=stix</code> for a STIX bundle. The endpoint does not store what it receives.</p>

                <h2>AI agents (MCP)</h2>
                <p>The <code>@mxlens/mcp</code> package is a Model Context Protocol server. Point an MCP client at the <code>mxlens-mcp</code> command and an agent can call <code>analyze_email</code> locally — the message never leaves the machine.</p>
                <pre><code>{`{
  "mcpServers": {
    "mxlens": { "command": "npx", "args": ["-y", "@mxlens/mcp"] }
  }
}`}</code></pre>

                <h2>Verifying authentication</h2>
                <p>By default MXLens reads the receiving server&apos;s Authentication-Results and marks them unverified, because headers added before your trusted gateway can be forged. Pass the authserv-id of your gateway (for example your inbound mail server) as <code>trustedAuthservIds</code> so only that header is trusted.</p>

                <h2>Detection rules</h2>
                <p>MXLens ships {rules.length} rules. Each reports the evidence it saw and its MITRE ATT&amp;CK technique. They are defined in the open — see <a href="https://github.com/akmalmuhammed/mxlens/tree/main/packages/engine/src/rules" target="_blank" rel="noopener noreferrer">packages/engine/src/rules</a>.</p>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                        <tr style={{ textAlign: "left", color: "var(--text-dim)" }}>
                            <th style={{ padding: "8px 6px", borderBottom: "1px solid var(--line)" }}>ID</th>
                            <th style={{ padding: "8px 6px", borderBottom: "1px solid var(--line)" }}>Rule</th>
                            <th style={{ padding: "8px 6px", borderBottom: "1px solid var(--line)" }}>Max severity</th>
                            <th style={{ padding: "8px 6px", borderBottom: "1px solid var(--line)" }}>ATT&amp;CK</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rules.map((r) => (
                            <tr key={r.id}>
                                <td style={{ padding: "7px 6px", borderBottom: "1px solid var(--line)", fontFamily: "var(--mono)", color: "var(--text-dim)" }}>{r.id}</td>
                                <td style={{ padding: "7px 6px", borderBottom: "1px solid var(--line)" }}>{r.title}</td>
                                <td style={{ padding: "7px 6px", borderBottom: "1px solid var(--line)", fontFamily: "var(--mono)" }}>{r.severity}</td>
                                <td style={{ padding: "7px 6px", borderBottom: "1px solid var(--line)", fontFamily: "var(--mono)", color: "var(--text-dim)" }}>{r.attack.map((a) => a.id).join(", ")}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>
            <SiteFooter />
        </>
    );
}
