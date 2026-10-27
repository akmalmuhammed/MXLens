import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { organizationalDomain } from "../../analysis/Domain";

/**
 * "Living off trusted sites": phishing pages on free hosting, serverless, AI site builders
 * and tunnels inherit a clean domain reputation and valid TLS. Zscaler 2026 counted 37k
 * malicious AI-built sites (Lovable, Manus, Anything...), and device-code kits front on
 * Workers, Vercel and GitHub Pages. A link there is not malicious by itself, so the
 * penalty is small unless it accompanies a sign-in/verification lure.
 */
export class HostingAbuseDetector implements Detector {
    id = "hosting-abuse";
    name = "Free Hosting / Tunnel Link";
    description = "Detects links to tunnels, free hosting, serverless and AI site-builder platforms, and abuse-heavy TLDs.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['link'];

    static readonly TUNNELS = [
        "trycloudflare.com", "ngrok.io", "ngrok.app", "ngrok-free.app", "ngrok-free.dev", "loca.lt",
        "serveo.net", "lhr.life", "localhost.run", "pinggy.link", "pinggy.online", "devtunnels.ms",
        "tunnelmole.net", "localtunnel.me", "bore.pub"
    ];
    static readonly FREE_HOSTING = [
        // serverless / static / object storage
        "pages.dev", "workers.dev", "r2.dev", "web.app", "firebaseapp.com", "firebasestorage.googleapis.com",
        "storage.googleapis.com", "appspot.com", "vercel.app", "netlify.app", "onrender.com", "fly.dev",
        "herokuapp.com", "glitch.me", "surge.sh", "github.io", "gitlab.io", "pages.github.io",
        "azurewebsites.net", "blob.core.windows.net", "web.core.windows.net", "azurestaticapps.net",
        "s3.amazonaws.com", "amplifyapp.com", "cloudfront.net", "edgeone.app", "edgeone.dev", "edgecompute.app",
        "deno.dev", "replit.app", "repl.co", "hf.space", "streamlit.app", "powerappsportals.com",
        // site builders and forms
        "webflow.io", "framer.app", "framer.website", "wixsite.com", "weebly.com", "godaddysites.com",
        "square.site", "carrd.co", "notion.site", "typedream.app", "mystrikingly.com", "jimdosite.com",
        "my.canva.site", "canva.site", "gamma.site", "site123.me", "ukit.me", "yolasite.com",
        // AI app/site builders
        "lovable.app", "lovable.dev", "manus.space", "created.app", "bolt.host", "v0.dev", "base44.app"
    ];
    // Google Sites/Forms and Microsoft Forms are hosted under first-party domains; match by path.
    private static readonly FIRST_PARTY_BUILDERS = [
        { host: "sites.google.com", path: /^\/(?:view|site)\//i, label: "Google Sites" },
        { host: "docs.google.com", path: /^\/(?:forms|presentation\/d\/e)\//i, label: "Google Forms/Slides publish" },
        { host: "forms.gle", path: /./, label: "Google Forms" },
        { host: "forms.office.com", path: /./, label: "Microsoft Forms" },
        { host: "forms.cloud.microsoft", path: /./, label: "Microsoft Forms" }
    ];
    static readonly ABUSED_TLDS = [
        "top", "xyz", "icu", "cfd", "sbs", "click", "zip", "mov", "lol", "rest", "quest", "cyou", "buzz",
        "monster", "bond", "cam", "tk", "ml", "ga", "cf", "gq", "su", "beauty", "hair", "skin", "autos",
        "boats", "yachts", "mom", "contractors", "ceo"
    ];

    private lure = /\b(?:sign\s?in|log\s?in|verify\s+(?:your|account|identity)|verification|password|credentials?|mailbox|voicemail|shared\s+(?:a\s+)?file|review\s+(?:and\s+)?sign|secure\s+(?:message|document))\b/i;

    detect(context: DetectionContext): DetectionResult | null {
        const urls = context.signals.extractedUrls || [];
        if (urls.length === 0) return null;
        const senderOrg = context.signals.fromDomain ? organizationalDomain(context.signals.fromDomain) : "";

        const tunnels = new Set<string>();
        const hosting = new Set<string>();
        const tlds = new Set<string>();
        for (const raw of urls) {
            let url: URL;
            try {
                url = new URL(raw);
            } catch {
                continue;
            }
            const host = url.hostname.toLowerCase();
            if (senderOrg && organizationalDomain(host) === senderOrg) continue;

            const under = (list: readonly string[]) => list.find(d => host === d || host.endsWith(`.${d}`));
            const tunnel = under(HostingAbuseDetector.TUNNELS);
            if (tunnel) {
                tunnels.add(host);
                continue;
            }
            const free = under(HostingAbuseDetector.FREE_HOSTING);
            const builder = HostingAbuseDetector.FIRST_PARTY_BUILDERS.find(b => host === b.host && b.path.test(url.pathname));
            if (free || builder) {
                hosting.add(builder ? `${builder.label} (${host})` : host);
                continue;
            }
            const tld = host.split(".").pop() || "";
            if (HostingAbuseDetector.ABUSED_TLDS.includes(tld)) tlds.add(host);
        }

        if (tunnels.size + hosting.size + tlds.size === 0) return null;

        const text = `${context.signals.subject || ""} ${context.signals.visibleText || context.emailBody?.text || ""}`;
        const lured = this.lure.test(text) || context.signals.hasCredentialHarvesting;

        let penalty = 0;
        const reasons: string[] = [];
        if (tunnels.size) {
            penalty -= 20;
            reasons.push(`link through a tunnelling service (${[...tunnels].slice(0, 2).join(", ")}) that exposes a private machine`);
        }
        if (hosting.size) {
            penalty -= lured ? 15 : 5;
            reasons.push(`link on free hosting / site-builder platform (${[...hosting].slice(0, 2).join(", ")})`);
        }
        if (tlds.size) {
            penalty -= lured ? 10 : 5;
            reasons.push(`link on an abuse-heavy TLD (${[...tlds].slice(0, 2).join(", ")})`);
        }
        penalty = Math.max(penalty, -35);

        return {
            triggered: true,
            score: penalty <= -20 ? 0.7 : 0.4,
            penalty,
            name: this.name,
            reason: `Message has a ${reasons.join("; and a ")}${lured ? ", alongside sign-in/document lure wording" : ""}. These hosts give throwaway phishing pages a clean reputation.`,
            metadata: { tunnels: [...tunnels], hosting: [...hosting], tlds: [...tlds], lured }
        };
    }
}
