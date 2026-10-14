# @mxlens/engine

Explainable, privacy-first email phishing analysis. Parses a raw email, checks
authentication (SPF/DKIM/DMARC alignment via the Public Suffix List, ARC-aware),
runs explainable detection rules mapped to MITRE ATT&CK, scores the risk, and
extracts indicators. **Runs in browsers and Node.js and makes no network calls.**

Part of [MXLens](https://github.com/akmalmuhammed/mxlens).

```bash
npm install @mxlens/engine
```

## Usage

```ts
import { analyzeEmail, toMarkdown, toStix } from "@mxlens/engine";

const result = await analyzeEmail(rawEmail); // string | Uint8Array | ArrayBuffer

result.verdict;       // "malicious" | "suspicious" | "clean"
result.riskScore;     // 0–100
result.summary;       // up to 3 plain-language sentences
result.findings;      // explained findings with evidence + ATT&CK techniques
result.authentication // SPF/DKIM/DMARC results and computed alignment
result.indicators;    // urls, domains, ips, emails, sha256
result.coverage;      // what was and was not checked

toMarkdown(result);   // ticket-ready summary (indicators defanged)
toStix(result);       // STIX 2.1 bundle
```

### Options

```ts
await analyzeEmail(raw, {
  trustedAuthservIds: ["mx.example.org"], // only believe this gateway's Authentication-Results
  analyzeBody: true,                       // parse body, links (default true)
  analyzeAttachments: true,                // hash + inspect attachments (default true)
  qrDecoder: async (img) => [],            // optional: decode QR images to URLs
});
```

Without `trustedAuthservIds`, the top-most `Authentication-Results` header is used
and the result is marked `trust: "assumed"` — it may be forged. The engine does
not perform DNS or signature cryptography itself; pair it with a verifier
(e.g. `mailauth`) in server/CLI contexts when you need that.

The result is plain JSON, safe to log, store or send over an API. See
[`listRules()`](https://github.com/akmalmuhammed/mxlens/tree/main/packages/engine/src/rules)
for the full rule set.

## License

Apache-2.0
