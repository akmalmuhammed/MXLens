import Link from "next/link";

const REPO = "https://github.com/akmalmuhammed/mxlens";

export function SiteFooter() {
    return (
        <footer className="footer">
            <div className="wrap footer-cols">
                <div style={{ maxWidth: "46ch" }}>
                    <strong>MXLens</strong> — open-source, explainable email phishing analysis.
                    <br />Apache-2.0. Built for SOC and IR analysts.
                </div>
                <div style={{ display: "flex", gap: 24 }}>
                    <div style={{ display: "grid", gap: 6 }}>
                        <Link href="/docs">Documentation</Link>
                        <Link href="/about">About</Link>
                    </div>
                    <div style={{ display: "grid", gap: 6 }}>
                        <a href={REPO} target="_blank" rel="noopener noreferrer">GitHub</a>
                        <a href={`${REPO}/security/policy`} target="_blank" rel="noopener noreferrer">Report a vulnerability</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
