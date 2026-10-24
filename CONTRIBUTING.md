# Contributing to MXLens

Thanks for helping. Bug reports, detection reports, docs and code are all welcome.

## Never share real emails

Reported phishing often contains real names, addresses, internal hostnames and tokens. Before
attaching an `.eml` to an issue or adding one as a test fixture:

- Replace domains with `example.com`, `example.net`, `example.org` (RFC 2606).
- Replace IP addresses with `192.0.2.x`, `198.51.100.x`, `203.0.113.x` (RFC 5737).
- Remove or replace names, signatures, tracking links, tokens and attachments.
- Keep only the headers and body needed to show the problem.

`.gitignore` blocks `.eml` files outside `tests/fixtures/` and `public/samples/` to make
accidents less likely.

## Development setup

Requires Node.js 20.9 or later.

```bash
npm ci
npm run dev          # http://localhost:3000
```

Before opening a pull request:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run build:cli    # if you touched cli/ or src/lib/email
```

CI runs the same checks, plus a Docker build and a secret scan.

## Project layout

| Path | What lives there |
|---|---|
| `src/lib/email/` | The analysis engine. Runs in the browser and in Node; no network calls. |
| `src/lib/email/detection/rules/` | Individual detection rules. |
| `src/lib/email/scoring/` | Scorers that turn signals into a verdict. |
| `src/lib/threat-intel/`, `src/actions/` | Optional server-side enrichment (off by default). |
| `src/components/`, `src/app/` | The Next.js web app. |
| `cli/` | The `mxlens` command-line tool (published to npm separately). |
| `tests/` | Vitest unit tests and synthetic fixtures. |

## Changing detection

Detection changes affect every user's verdicts, so they need evidence:

1. Add a sanitized fixture under `tests/fixtures/email/` that shows the problem.
2. Add a test asserting the expected verdict or finding.
3. Explain in the PR what the change catches and what it could misfire on.
4. Update `docs/DETECTION_TEST_MATRIX.md` if a rule's behavior or score changes.

Prefer lowering confidence over raising risk when a signal is merely unusual rather than
malicious.

## Pull requests

- Keep each PR focused on one change.
- Describe what changed and how you tested it.
- The engine must stay free of network calls and of imports from the app (`@/components`,
  `@/app`, `@/actions`).

By contributing you agree that your contributions are licensed under the MIT License.
