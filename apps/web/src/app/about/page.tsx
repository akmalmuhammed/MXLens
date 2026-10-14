import type { Metadata } from "next";
import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = { title: "About — MXLens", description: "What MXLens is, how it works, and what it does not do." };

export default function About() {
    return (
        <>
            <TopBar />
            <main className="wrap prose">
                <h1>About MXLens</h1>
                <p>MXLens is an open-source tool for analyzing email for phishing. Drop in a message and it explains, with evidence, why the message is or is not suspicious — the way an analyst would reason through it, but in a second.</p>

                <h2>How it works</h2>
                <p>Every analysis runs the same engine, <code>@mxlens/engine</code>. It parses the MIME structure, reads the authentication results and computes DMARC alignment against the organizational domain, inspects every link and attachment, and runs a set of explainable rules. Each rule reports the exact evidence it saw and the <a href="https://attack.mitre.org/" target="_blank" rel="noopener noreferrer">MITRE ATT&amp;CK</a> technique it maps to. Scores are combined so that weak signals never outweigh strong ones.</p>

                <h2>Privacy</h2>
                <p>In this web app, parsing and scoring happen entirely in your browser. The message you analyze is never uploaded. The REST API at <code>/api/v1/analyze</code> runs the same engine on the server and does not store what it receives. Nothing in MXLens sends your email to a third party; reputation lookups against external services are not part of the default analysis.</p>

                <h2>What it does not do</h2>
                <ul>
                    <li>It does not cryptographically verify DKIM or ARC signatures in the browser. It reads the receiving server&apos;s Authentication-Results, and tells you when it could not verify them. The CLI can verify signatures directly.</li>
                    <li>A &ldquo;clean&rdquo; verdict means no strong indicators were found, not that a message is proven safe. The coverage panel shows what was and was not checked.</li>
                    <li>It is a decision aid, not a decision. Treat high-stakes actions — paying an invoice, resetting a credential — with independent confirmation.</li>
                </ul>

                <h2>Open source</h2>
                <p>MXLens is Apache-2.0 licensed. The engine, CLI and MCP server are published on npm, and the detection rules live in the open so the community can review and extend them. Contributions, especially new detection rules with test fixtures, are welcome on <a href="https://github.com/akmalmuhammed/mxlens" target="_blank" rel="noopener noreferrer">GitHub</a>.</p>
            </main>
            <SiteFooter />
        </>
    );
}
