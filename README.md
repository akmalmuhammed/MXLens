# MXLens

**Explainable, privacy-first email phishing analysis.** Drop in a raw email and
MXLens tells you whether it is phishing, scores the risk, and shows the evidence
for every finding — the way a SOC analyst would reason through it, in a second.

One engine powers four ways to run it: a browser app, a CLI, a REST API, and an
MCP server for AI agents. Parsing and scoring are local and make no network
calls, so the message you analyze never has to leave your machine.

[![CI](https://github.com/akmalmuhammed/mxlens/actions/workflows/ci.yml/badge.svg)](https://github.com/akmalmuhammed/mxlens/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)

> **Status:** v1. The accuracy numbers below come from the bundled synthetic
> corpus, which is a single labeled set, not a train/test split. Treat them as a
> regression gate, not a benchmark against real-world mail.

---

## Why MXLens

Most open-source email tools either just *extract* headers and indicators, or
run only inside a vendor's platform. MXLens gives you a **scored, explained
verdict** you can run anywhere and read in plain language:

- **Explains itself.** Every finding names the rule, the exact evidence (the
  header, link or attachment it saw), a severity, and the
  [MITRE ATT&CK](https://attack.mitre.org/) technique it maps to.
- **Gets identity right.** RFC 5322 address parsing (a spoofed address hidden in
  a display name can't fool it), real DMARC alignment using the Public Suffix
  List, and ARC-aware handling so forwarded mail and mailing lists aren't flagged.
- **Catches modern tricks.** Homograph and punycode domains, typo- and
  combosquats, brand-decoy hostnames, open redirects, credential forms, HTML
  smuggling, disguised and macro attachments, and call-back (phone) scams.
- **Exports for your stack.** JSON, a ticket-ready Markdown summary, CSV, and
  STIX 2.1 — indicators come out defanged.
- **Honest about limits.** A "clean" verdict says *no strong indicators found*,
  never *proven safe*, and every result lists what it could not check.

## Quick start

```bash
# CLI
npm install -g mxlens
mxlens suspicious.eml

# or without installing
npx mxlens suspicious.eml
cat mail.eml | npx mxlens - --format json
```

```ts
// Library — runs in Node and the browser
import { analyzeEmail, toMarkdown } from "@mxlens/engine";

const result = await analyzeEmail(rawEmlStringOrBytes);
console.log(result.verdict, result.riskScore);   // "malicious" 82
console.log(toMarkdown(result));                  // ticket-ready summary
```

```jsonc
// MCP — let an AI agent analyze mail locally
{
  "mcpServers": {
    "mxlens": { "command": "npx", "args": ["-y", "@mxlens/mcp"] }
  }
}
```

The web app is in `apps/web` (`npm run web`), and the hosted demo runs the whole
analysis in your browser.

## Packages

| Package | What it is | Install |
| --- | --- | --- |
| [`@mxlens/engine`](./packages/engine) | The analysis engine and types. No network calls; runs in browsers and Node. | `npm i @mxlens/engine` |
| [`mxlens`](./packages/cli) | Command-line analyzer (text, JSON, Markdown, CSV, STIX; exit codes for CI). | `npm i -g mxlens` |
| [`@mxlens/mcp`](./packages/mcp) | Model Context Protocol server (stdio) for AI agents. | `npm i -g @mxlens/mcp` |
| [`@mxlens/web`](./apps/web) | The web analyzer and REST API. | self-host |

## How it works

```
 raw .eml ─▶ parse (MIME, headers, links, attachments)
          ─▶ authentication (SPF / DKIM / DMARC alignment via PSL, ARC-aware)
          ─▶ rules (identity, links, attachments, content, headers)
          ─▶ score (noisy-OR, so weak signals never outweigh strong ones)
          ─▶ verdict + findings + indicators + coverage
```

The engine never calls the network. Reputation lookups against third-party
services (VirusTotal, AbuseIPDB, …) are intentionally **not** part of the default
analysis; they are a documented future add-on behind explicit opt-in.

### Authentication, honestly

By default MXLens reads the receiving server's `Authentication-Results` and marks
them **unverified**, because any header added before your trusted gateway can be
forged. Pass your gateway's `authserv-id` as `trustedAuthservIds` (CLI: `--trust`)
so only that header is believed. Cryptographic DKIM/ARC verification is a CLI
option, not something the browser does.

## Accuracy

CI runs the engine over the labeled corpus in [`corpus/`](./corpus) and fails on
a regression (recall below 90% or false-positive rate above 10%). Current result
on that corpus: **100% recall, 0% false positives across 49 messages.** Every
message is synthetic — RFC 2606 domains and RFC 5737 IPs — so no real mail is in
the repo. Run it yourself:

```bash
npm run eval
```

Because the corpus is a single development set, these numbers show the rules do
what they claim on known cases, not how MXLens performs on live mail. Adding
harder cases is the most useful contribution you can make.

## Develop

```bash
npm install          # Node 20+
npm test             # engine, CLI and MCP unit tests
npm run eval         # accuracy report
npm run build        # build the publishable packages
npm run web          # run the web app locally
```

## Contributing

New detection rules — each with a positive and a negative fixture — are the most
valuable contribution. See [CONTRIBUTING.md](./CONTRIBUTING.md). To report a
security issue, see [SECURITY.md](./SECURITY.md); please do not open a public
issue for vulnerabilities.

## License

[Apache-2.0](./LICENSE) © Akmal Muhammed and MXLens contributors.
MXLens is a decision aid, not a decision — confirm high-stakes actions
independently. It is provided without warranty.
