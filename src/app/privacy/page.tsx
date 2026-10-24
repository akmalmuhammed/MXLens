import type { Metadata } from "next";
import Link from "next/link";
import { GITHUB_URL } from "@/lib/site";

export const metadata: Metadata = {
    title: "Privacy - MXLens",
};

export default function PrivacyPage() {
    return (
        <div className="container mx-auto max-w-3xl px-4 py-16 space-y-6 text-muted-foreground">
            <h1 className="text-3xl font-bold text-foreground">Privacy</h1>
            <p>
                MXLens has no accounts, no database and no analytics. This page describes what the software does;
                anyone running their own copy can verify it in the <a className="underline" href={GITHUB_URL}>source code</a>.
            </p>

            <h2 className="text-xl font-semibold text-foreground pt-4">Emails you analyze</h2>
            <p>
                Files you drop on the <Link className="underline" href="/analyze">analyzer</Link> are parsed and scored
                in your browser. The email, its body and its attachments are not uploaded. The most recent result is kept
                in your browser&apos;s session storage so a page refresh does not lose it; closing the tab clears it.
            </p>

            <h2 className="text-xl font-semibold text-foreground pt-4">External lookups</h2>
            <p>
                External lookups are off by default. If the operator of a server enables them, the server sends
                indicators extracted from the email (public IP addresses, domains and attachment hashes, never the email
                itself) to reputation and geolocation services such as VirusTotal, AbuseIPDB, abuse.ch, Google Safe
                Browsing, PhishTank and ipinfo. The analyzer page says when this is the case.
            </p>

            <h2 className="text-xl font-semibold text-foreground pt-4">Server logs</h2>
            <p>
                Like any web server, the server hosting this page may keep standard access logs (IP address, time,
                requested URL). MXLens itself does not log analysis results.
            </p>
        </div>
    );
}
