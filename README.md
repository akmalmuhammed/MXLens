<p align="center"><img src="public/logo.png" alt="MXLens" width="320"></p>

# MXLens

Free, open-source phishing analysis for `.eml` files. Drop in a suspicious email and get a
verdict with the reasons behind it: SPF/DKIM/DMARC/ARC results, relay path, lookalike
domains, link and attachment checks, and content heuristics.

- **Runs in your browser.** The email is parsed and scored locally and never uploaded.
- **No account, no database, no tracking.**
- **Self-hostable** with Node or Docker. Nothing to configure.
- **Command-line tool** for scripts, mail pipelines and bulk triage: `npx mxlens message.eml`.
- **Optional enrichment** (VirusTotal, AbuseIPDB, abuse.ch, Safe Browsing, geolocation) if
  you bring your own keys. Off by default.

MIT licensed.

## Quick start

Requires Node.js 20.9 or later.

```bash
git clone https://github.com/akmalmuhammed/mxlens.git
cd mxlens
npm ci
npm run build
npm start
```

Open http://localhost:3000/analyze and drop an `.eml` file (or try
`public/samples/demo-phishing.eml`).

For development: `npm run dev`.

## CLI

```bash
npx mxlens suspicious.eml              # readable report
npx mxlens --json reported-folder/     # JSON for every .eml in a folder
npx mxlens --fail-on malicious - < message.eml   # exit code 2 if malicious
```

The CLI runs the same engine as the web app, entirely offline. See [`cli/README.md`](cli/README.md).

## Self-hosting

### Docker

```bash
docker compose up -d --build
```

This serves MXLens on `127.0.0.1:3000`. Put it behind your usual reverse proxy (with TLS) to
share it with a team.

Or run the published image:

```bash
docker run -d -p 127.0.0.1:3000:3000 ghcr.io/akmalmuhammed/mxlens:latest
```

### Configuration

None is required. All settings are optional environment variables; see
[`.env.example`](.env.example).

| Variable | Default | Effect |
|---|---|---|
| `MXLENS_ENRICHMENT` | `false` | Enables server-side lookups of indicators extracted from emails. |
| `VIRUSTOTAL_API_KEY` | | VirusTotal reputation for IPs, domains and hashes. |
| `ABUSEIPDB_API_KEY` | | AbuseIPDB reputation for IPs. |
| `ABUSECH_API_KEY` | | MalwareBazaar and ThreatFox lookups. |
| `GOOGLE_SAFE_BROWSING_KEY` | | Safe Browsing lookups for domains. |
| `IPINFO_TOKEN` | | Higher rate limits for IP geolocation. |

## Privacy model

| | Enrichment off (default) | Enrichment on |
|---|---|---|
| Email content, body, attachments | Stays in the browser | Stays in the browser |
| Public IPs, domains, attachment hashes | Stay in the browser | Sent by the server to the services above |
| Private IPs and internal hostnames | Stay in the browser | Filtered out, never sent |

The analyzer page states which mode the server is in. Enrichment endpoints are rate limited
per client IP.

## How it works

```
.eml ─► postal-mime (MIME parsing) ─► HeaderParser (auth results, hops, artifacts)
                                         │
                                         ▼
                              AnalysisEngine
                              ├─ HeaderScorer      ├─ AttachmentScorer
                              ├─ BodyScorer        ├─ ImpersonationScorer / HomographDetector
                              ├─ CrossContextScorer├─ DetectionPipeline (rules)
                              └─ Trust + Confidence ─► verdict with findings
```

The engine lives in [`src/lib/email`](src/lib/email) and runs unchanged in the browser and in
Node.

## Development

```bash
npm run dev         # local dev server
npm run test:run    # unit tests
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm run build:cli   # bundle the CLI to cli/dist/mxlens.mjs
```

### Engine API

```ts
import { analyzeEmail } from "@/lib/email/analyze";

const result = await analyzeEmail(rawEml, { body: true, attachments: true });
result.verdict;   // "clean" | "suspicious" | "malicious" | "unknown"
result.findings;  // [{ reason, severity, impact, ... }]
```

## Roadmap

- Local REST and MCP API for automation and AI agents
- Detection accuracy: DMARC policy handling, ARC overrides, Office macro detection, a larger
  synthetic test corpus
- Browser extension and mail-client add-ins built on the engine

## Limitations

MXLens is a triage aid, not an email security gateway. Verdicts are heuristic: expect some
false positives and misses, and verify before acting. Reports with a sanitized sample are
welcome.

## License

[MIT](LICENSE)
