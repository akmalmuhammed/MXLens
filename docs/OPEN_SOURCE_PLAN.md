# MXLens Open-Source Plan

Goal: turn MXLens from a closed SaaS into a free, MIT-licensed email phishing
analyzer that anyone can run locally or self-host, and replace the live SaaS
with a free, no-login demo.

## Decisions

| Topic | Decision |
|---|---|
| Scope | Lean local tool. No accounts, billing, orgs, admin panel or database. |
| License | MIT |
| Live SaaS | Replaced by the OSS landing page + free in-browser analyzer. Paid features retired. |
| Repository | Public release starts from a **fresh repository with no history**. The current repo's history contains user dumps, password hashes and a database connection string; it stays private. |

## What ships

1. **Web analyzer**: drop an `.eml` and get a verdict. Parsing and scoring run in the
   browser. No signup, no database, no telemetry.
2. **CLI**: `npx mxlens analyze message.eml` with text or `--json` output, batch over a
   folder, non-zero exit code on malicious verdicts (usable in scripts and CI).
3. **Local API + MCP server** for agents and automation, bound to localhost by default,
   optional bearer token when exposed.
4. **Docker image**: `docker run -p 3000:3000 mxlens` for self-hosting.
5. **Optional enrichment**: VirusTotal, AbuseIPDB, abuse.ch, Google Safe Browsing and
   ipinfo only when the operator supplies their own keys. Off by default and clearly
   labelled, because it sends indicators (IPs, domains, hashes) to third parties.

## What gets removed

- Auth: Clerk, NextAuth leftovers, admin auth, `admin.*` subdomain routing.
- Billing: Stripe, plans, quotas, usage limits, `limit-reached`, pricing page.
- Multi-tenant SaaS: orgs, memberships, invites, dashboard, team, settings, API keys,
  integrations, webhooks, cron jobs, notifications, onboarding, history, triage/comments.
- Infrastructure: Prisma/Postgres, Supabase, Upstash Redis, Resend, Sentry, PostHog,
  Vercel Analytics.
- SaaS marketing pages: pricing, careers, partners, case studies, webinars, trust center,
  status, comparisons, cookie policy and SaaS-specific legal pages.
- Repo junk: logs, tsc dumps, user dumps, admin scripts, real phishing samples
  (`test-samples/`), `.compare/`, `extras/admin-draft/`, `temp_adapter.mjs`.

## Phases

### Phase 0: Protect the live site (owner, now)
- Rotate the Neon database password and any admin passwords that appear in scripts.
- Either merge PR #1 (security hotfix) or take the SaaS offline until Phase 6 ships.
  The rest of this plan deletes every surface PR #1 patches.

### Phase 1: Strip to the lean core
- Delete everything in "What gets removed".
- Root layout without Clerk/PostHog/Analytics; `/analyze` works with zero env vars.
- Remove the SaaS-only panels from the results view (triage, incident workbench,
  "save to history").
- Gate enrichment server actions behind `MXLENS_ENRICHMENT=1` + per-provider keys, keep
  the SSRF/private-IP guards.
- `.env.example` documents every remaining variable (all optional).
- Exit: `npm run build`, `npm test` and `tsc --noEmit` pass with an empty environment.

### Phase 2: Engine as a reusable library + CLI
- Make `src/lib/email` free of app imports so it can be bundled on its own.
- `mxlens` CLI (Node 20+): `analyze <file|dir|->`, `--json`, `--no-body`,
  `--no-attachments`, `--fail-on suspicious|malicious`.
- Publishable npm package with the engine API (`analyzeEmail(raw, options)`).

### Phase 3: Detection correctness (from the engineering audit)
- DMARC policy normalization, ARC override scope, auth UI showing "accepted" on DMARC fail,
  macro-enabled Office misclassification, case-insensitive headers, attachment toggle
  ordering, link-mismatch false positives, raw-headers field size.
- Synthetic fixture corpus (RFC 2606 domains, RFC 5737 IPs) with expected verdicts; the
  detection test matrix in `docs/DETECTION_TEST_MATRIX.md` becomes executable tests.

### Phase 4: Self-hosting
- Dockerfile (Next standalone output) + `docker-compose.yml`.
- Local REST API (`POST /api/v1/analyze`) and MCP endpoint without accounts; optional
  `MXLENS_API_TOKEN`; request size limits.
- Strict CSP, no third-party scripts.

### Phase 5: Open-source hygiene
- `LICENSE` (MIT), real `README`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`,
  issue/PR templates.
- CI: install, lint, typecheck, test, build, gitleaks.
- Trim dependencies; resolve `npm audit` highs; drop `.npmrc` `legacy-peer-deps` if possible.

### Phase 6: Launch
- Create the fresh public repo from the cleaned tree (single initial commit).
- Publish the npm package and a Docker image (GHCR).
- Deploy the demo to the existing domain; email existing users; cancel Stripe
  subscriptions and refund as appropriate; delete the production database after export.
- Launch posts: Show HN, r/netsec, r/sysadmin, Product Hunt, security newsletters.
- Follow-ups: browser extension built on the engine package, Outlook/Gmail add-ins,
  YARA-style custom rules.

## Status

- [ ] Phase 0: owner actions (rotate Neon password and admin passwords; merge PR #1 or take the SaaS offline)
- [x] Phase 1: strip to the lean core
  - SaaS code, pages, APIs, Prisma, auth, billing, telemetry and repo junk removed
  - Enrichment behind `MXLENS_ENRICHMENT` with PR #1's IP/domain/hash guards and in-memory rate limits
  - Fonts and the PDF.js worker bundled locally; strict CSP with `connect-src 'self'`
  - Landing copy corrected (no WebAssembly, GDPR/HIPAA, "85+ rules", pricing or user-count claims)
  - Verified: build with empty env, 23 tests, typecheck, lint (0 errors), browser run with zero
    external requests
- [ ] Phase 2: engine library + CLI
- [ ] Phase 3: detection correctness
- [ ] Phase 4: self-hosting (Dockerfile, compose and CI image build done early; local REST/MCP API left)
- [ ] Phase 5: open-source hygiene (LICENSE, README, CI done early; CONTRIBUTING, SECURITY, templates left)
- [ ] Phase 6: launch

### Not for the public repository

- `docs/engineering-audit-2026-05-01.md` describes vulnerabilities in the retired SaaS. Keep it
  in the private repo only.
- The engineering audit and the old browser-extension prototype were removed from the tree;
  they remain in this private repository's history.
