# MXLens Engineering Audit

> **Status note (2026-10-25):** This document is the historical baseline. A focused remediation set was implemented after review; see [remediation-next-build.md](./remediation-next-build.md) for fixed findings, deployment steps, and remaining stop-ship work. Do not treat every finding below as current without checking that status document.

Date: 2026-05-01
Scope: security, tenancy, auth, admin APIs/actions, email analysis correctness, billing/webhooks, frontend/admin UX, dependencies, build, CI, and repo hygiene.

## Executive Summary

The codebase now builds, lints, typechecks, and the existing tests pass after the earlier repair pass, but it is not production-ready from an enterprise engineering/security standpoint.

The highest-risk issues are:

1. Decrypted integration secrets are exported from a `"use server"` action module with no authorization check.
2. Cross-tenant analysis reports, triage state, and comments are not consistently scoped by `orgId`.
3. Tracked repository artifacts include user exports, emails, password hashes, hardcoded admin credentials, build logs, and a public WASM source map.
4. CI is disabled and quality gates are not enforced.
5. The email analyzer still has semantic correctness bugs around DMARC enforcement, ARC overrides, and UI labels.
6. Billing/webhook entitlement state can remain wrong after Stripe cancellation.

## Verification Performed

- `npm run test:run`: passed earlier, 48 passed, 2 skipped.
- `npm run lint`: passed earlier with 386 warnings, 0 errors.
- `npm run build`: passed earlier on Next 16.2.4 after a clean `.next`.
- `npx tsc --noEmit --pretty false`: passed earlier.
- `npm run test:run -- tests/unit/email-analysis-samples.test.ts`: passed, 3 tests.
- Full local `.eml` sweep: 30/30 samples parsed and analyzed with 0 runtime failures.
- `npx prisma validate`: fails without `DIRECT_URL`; passes when `DATABASE_URL` and `DIRECT_URL` are provided as dummy valid PostgreSQL URLs.
- `npm audit --audit-level=moderate`: 77 vulnerabilities, 67 high, 10 moderate.
- `npm outdated --long`: many runtime and tooling packages are behind.

## P0 / Critical

### 1. Decrypted Integration Secrets Exposed From Server Action Module

Location: `src/actions/integrations.ts:1`, `src/actions/integrations.ts:72-88`

Evidence:
- File has `"use server"`.
- `getDecryptedConfig(integrationId)` is exported and performs no user/session/org authorization.
- The built server action manifest registers `getDecryptedConfig`.

Impact: A callable action ID plus integration ID can expose decrypted Jira/API/webhook secrets across tenants.

Fix:
- Move decryption into a non-action `server-only` module under `src/lib`.
- Do not export internal helpers from `"use server"` files.
- Add an internal caller model and explicit org ownership validation.
- Rotate any integration credentials that may have been exposed.

### 2. Cross-Tenant Analysis Report Access

Location: `src/app/analysis/[id]/page.tsx:22-38`

Evidence:
- The page fetches `AnalysisLog` by `id` only.
- It allows access when `log.orgId !== session.user.orgId` if `session.user.role === "ADMIN"`.
- `session.user.role` is an org role, not a platform-wide admin role.

Impact: An admin in one tenant can read another tenant's report if they know or guess an analysis ID.

Fix:
- Query by `id` and `orgId: session.user.orgId`.
- Remove org-role bypass from tenant pages.
- Use a separate platform-admin route/guard for cross-tenant admin review.

### 3. Cross-Tenant Triage and Comment IDOR

Location: `src/actions/analysis.ts:251-315`

Evidence:
- `addComment(id, content)` creates by `analysisLogId: id` without verifying the analysis belongs to the caller's org.
- `getAnalysisTriageState(analysisId)` reads by `id` only.

Impact: Authenticated users can read or mutate incident triage/comments for another tenant if an ID is known.

Fix:
- Verify `AnalysisLog` ownership before comment creation.
- Query triage by `id + orgId`.
- Keep verification and write in the same transaction where possible.

## P1 / High

### 4. Admin RBAC Is Defined But Not Enforced

Locations:
- `src/lib/admin/auth.ts:154-159`
- `src/app/api/admin/organizations/route.ts:84-173`
- `src/app/api/admin/users/[id]/route.ts:99-250`

Evidence:
- `requireAdminApi()` only verifies an admin session.
- Mutating admin routes do not require role-specific permissions.

Impact: `READ_ONLY`, support, or billing admins can mutate users, orgs, and platform state.

Fix:
- Replace bare `requireAdminApi()` with method-specific guards.
- Enforce permissions for `users`, `billing`, `settings`, `write`, and `read`.
- Deny by default.

### 5. Admin Server Actions Leak Security Data And Use Mixed Auth Models

Locations:
- `src/actions/admin/security.ts:17-63`
- `src/actions/admin/abuse.ts:12-18`
- `src/actions/admin/emergency.ts:23-39`

Evidence:
- `getSecurityOverview()` returns global threat counts, recent incidents, `meta`, `userId`, and org names without admin auth.
- `getAbuseStats()` returns blocked IPs without admin auth.
- Emergency admin actions use regular `auth()` instead of the isolated `admin_token` session model.

Impact: Platform security telemetry can leak. Some admin mutations may authorize against the wrong identity.

Fix:
- Centralize admin server-action authorization around `verifyAdminSession()` plus role checks.
- Never return "all clear" data on auth or infrastructure failure.
- Add explicit error states to admin UI.

### 6. Tracked User Dumps, Password Hashes, And Hardcoded Admin Passwords

Locations:
- `db_users.json`
- `db_users_dump.json`
- `users.json`
- `scripts/create-admin-user.ts:13-14`
- `scripts/create-admin.ts:7-8`
- `scripts/create_admin_user.ts:7-8`
- `scripts/reset_admin_password.ts:8`
- `check-reset-admin.ts:65`

Evidence:
- Tracked JSON contains emails and bcrypt password hashes.
- Scripts hardcode and print admin emails/passwords such as temporary admin passwords.

Impact: Repository access exposes user data and reusable admin credentials. This may require credential rotation and history purge if the repository was shared.

Fix:
- Remove dumps and scratch scripts from git.
- Purge history if this branch/repo was shared.
- Rotate affected credentials.
- Require admin script inputs through env or secure CLI prompts.
- Expand `.gitignore` for dumps, logs, and scratch admin files.

### 7. Public SSRF/Open Fetch Endpoint

Location: `src/app/api/edge/rep/url/route.ts:5-41`

Evidence:
- Accepts arbitrary `url` query input.
- Calls `fetch(targetUrl, { method: "HEAD", redirect: "follow" })`.
- No auth, rate limit, timeout, protocol allowlist, private-network block, or redirect validation.

Impact: Can be abused for internal probing, metadata access depending on runtime network, or third-party scanning.

Fix:
- Allow only `http:` and `https:`.
- Block localhost, private, link-local, and metadata addresses after DNS resolution.
- Limit redirects and enforce timeout.
- Add rate limiting and consider authentication.

### 8. Webhook Ingest Lacks Required Auth, Rate Limit, And Idempotency

Location: `src/app/api/webhooks/ingest/[integrationId]/route.ts:25-70`

Evidence:
- Comments state it relies on obscure `integrationId`.
- Only `GENERIC_WEBHOOK` optionally checks `x-webhook-secret`.
- Jira payloads have no signature check before creating incidents.
- No idempotency key, replay protection, or webhook delivery record.

Impact: Leaked integration IDs allow forged incidents, dashboard poisoning, and quota/storage abuse.

Fix:
- Require HMAC/timestamp signatures for generic webhooks.
- Validate provider signatures for Jira and other integrations.
- Add per-integration rate limiting.
- Store idempotency keys and delivery records.

### 9. Usage Quota Is Bypassable And Racy

Locations:
- `src/actions/analysis.ts:16-163`
- `src/components/email/EmailAnalyzer.tsx:157-193`
- `src/components/email/BulkProcessor.ts:85-100`

Evidence:
- `checkAndTrackUsage()` counts usage before analysis.
- `saveAnalysis()` persists history without enforcing quota.
- Analyzer re-runs use `skipUsageCheck=true` and still save.
- Bulk processing calls `saveAnalysis()` directly.

Impact: Users can exceed limits and inflate history/dashboard metrics via reanalysis, bulk uploads, retries, or concurrent requests.

Fix:
- Make `saveAnalysis()` the quota enforcement point.
- Atomically reserve quota and create the log in one transaction/counter update.
- Do not persist option-only reanalysis unless explicitly requested.

### 10. Stripe Cancellation Does Not Downgrade Entitlements

Location: `src/app/api/webhooks/stripe/route.ts:42-112`

Evidence:
- All events are cast to `Stripe.Checkout.Session`.
- `customer.subscription.deleted` reads `session.subscription`; the event object is a `Stripe.Subscription`, so the subscription ID is `subscription.id`.

Impact: Canceled subscriptions can remain `PRO`.

Fix:
- Switch on `event.type` before casting.
- For `customer.subscription.deleted`, cast to `Stripe.Subscription` and use `subscription.id`.
- Add `subscriptionId @unique` and webhook regression tests.

### 11. JWT Membership Claims Become Stale Authority

Location: `src/auth.ts:140-195`

Evidence:
- JWT callback reloads org/role only when `token.orgId` is missing.
- Server actions trust `session.user.orgId` and `session.user.role`.

Impact: Removed members or downgraded roles may retain access until token refresh/session expiration.

Fix:
- Add `requireOrgMember()` for protected actions/routes.
- Re-check active membership and role at mutation/read boundaries.
- Consider session versioning invalidated on membership changes.

### 12. Email DMARC Enforcement Action Is Not Normalized

Location: `src/lib/email/scoring/SignalNormalizer.ts:22-27`

Evidence:
- Parser only maps `p=reject`, `p=quarantine`, and `p=none`.
- Real samples contain `dmarc=fail action=oreject` and `dmarc=fail action=quarantine`.

Impact: Enforced DMARC failures remain "Suspicious" instead of triggering the High Risk override.

Fix:
- Parse `action=oreject`, `action=reject`, and `action=quarantine`.
- Parse policy/action from the full Authentication-Results value.
- Add regression tests for samples 40 and 43.

### 13. ARC Pass Refunds SPF/DKIM Penalties Too Broadly

Location: `src/lib/email/scoring/HeaderScorer.ts:46-70`

Evidence:
- Current logic refunds SPF/DKIM penalties whenever `arcResult === "pass"`.
- It refunds even when origin SPF/DKIM is `none` or `fail`.

Impact: ARC can mask failed authentication and inflate trust. A synthetic trusted-authserv example with SPF fail, DKIM fail, DMARC fail, ARC pass, and origin SPF/DKIM fail scored as "Suspicious" instead of "High Risk".

Fix:
- Refund only when ARC origin shows aligned SPF or DKIM pass.
- Never refund when origin SPF/DKIM is none/fail.
- Validate the sealing domain/authserv chain before trusting ARC context.

### 14. Authentication UI Can Show Accepted For DMARC Failure

Location: `src/components/analysis/AuthJourneyCard.tsx:78-82`

Evidence:
- Final verdict displays `ACCEPTED` when SPF or DKIM passes.
- It ignores DMARC failure.

Impact: Analysts can see a rejected DMARC result presented as accepted.

Fix:
- Drive the label from DMARC pass, ARC-validated origin, or the scoring verdict.
- Add UI regression tests for DMARC fail with DKIM pass.

### 15. Macro-Enabled Office Files Are Misclassified As ZIP Masquerading

Location: `src/lib/email/scoring/SignalNormalizer.ts:81-86`

Evidence:
- ZIP magic is allowed for `docx`, `xlsx`, and `pptx`, but not `docm`, `xlsm`, or `pptm`.

Impact: Legitimate macro-enabled OOXML files can be flagged as masquerading before macro scoring runs.

Fix:
- Include `docm`, `xlsm`, and `pptm` in the ZIP container allowlist.
- Let macro-enabled and macro-detected rules score the risk.

### 16. Fabricated Analysis Result Route

Location: `src/app/analyze/results/[id]/page.tsx:7-12`

Evidence:
- The route derives "Malicious" vs "Clean" solely from whether the ID starts with `mal`.
- Auth results and timestamps are hardcoded.

Impact: Direct links can display plausible but fake security verdicts.

Fix:
- Remove the route, redirect to real persisted analysis, or clearly isolate it as a demo route unavailable in production.

## P2 / Medium

### 17. CI Is Disabled And Gates Are Commented Out

Location: `.github/workflows/ci.yml.disabled:1-42`

Evidence:
- Workflow file extension is `.disabled`.
- Lint, typecheck, and tests are commented out.
- Only build remains.

Impact: Type, test, lint, vulnerable dependency, and build regressions can merge without signal.

Fix:
- Rename to `ci.yml`.
- Run `npm ci`, lint with `--max-warnings=0`, `tsc`, tests, audit, Prisma validation, and build.

### 18. Vulnerable Plasmo/Parcel Cluster In Root Production Dependencies

Location: `package.json:67`

Evidence:
- `plasmo` is in root `dependencies`.
- `npm audit` reports 77 vulnerabilities, mostly via Plasmo/Parcel; 67 are high.

Impact: Extension build tooling and vulnerable transitive packages ship into the app install surface.

Fix:
- Remove Plasmo from root runtime dependencies unless required at runtime.
- Isolate extension tooling into a separate workspace/package.
- Patch/upgrade/downgrade only after testing the extension build.

### 19. `.npmrc` Masks Peer Dependency Problems

Location: `.npmrc:1`

Evidence:
- `legacy-peer-deps=true`.

Impact: Clean installs can accept incompatible React, Next, auth, and build-tool combinations without surfacing conflicts.

Fix:
- Remove the flag.
- Resolve peer conflicts explicitly.
- Use overrides only for reviewed security patches.

### 20. Lint Warnings Are Not Actionable

Location: `eslint.config.mjs:36-41`

Evidence:
- Correctness rules are downgraded to warnings.
- Current lint exits 0 with 386 warnings.

Impact: CI can pass while hook correctness, unsafe `any`, ignored TS errors, and dead code accumulate.

Fix:
- Promote core correctness rules to errors or run `eslint --max-warnings=0`.
- Add narrow suppressions only where justified.

### 21. Generated Logs, Dumps, And Public Source Map Are Tracked

Locations:
- `.gitignore:20-23`
- `public/wasm/detection.wasm.map`
- root `build*.log`, `test_output*.txt`, `tsc*.txt`, `full_error.log`

Evidence:
- Root logs and output files are tracked.
- `public/wasm/detection.wasm.map` is tracked and served publicly, with `sourcesContent` and `DEBUG = true`.

Impact: Stale logs obscure build health and expose local diagnostics/source details.

Fix:
- Untrack generated logs and source maps.
- Add generic ignores for logs/output/dumps/maps.
- Publish source maps only to private debugging storage.

### 22. Email Samples May Contain PII/Security Telemetry

Location: `test-samples/*.eml`

Evidence:
- 30 tracked `.eml` fixtures contain real-looking headers, names, hosts, IPs, addresses, and message bodies.

Impact: Repo sharing can expose sensitive email telemetry.

Fix:
- Replace with synthetic fixtures or redacted samples.
- Move sensitive corpora to private storage excluded from git.

### 23. Password Reset And Login Throttling Are Incomplete

Locations:
- `src/app/api/admin/auth/login/route.ts:16`
- `src/auth.ts:57-93`
- `src/actions/password-reset.ts:18-51`

Evidence:
- Admin login uses one global key, enabling global lockout.
- User credential login logs failures but does not block at threshold.
- Password reset has no throttle.

Impact: Brute-force resistance is weak; attackers can deny admin login globally.

Fix:
- Enforce per-IP plus per-account throttles.
- Add password reset and verification email throttles.
- Keep generic responses and fail closed at threshold.

### 24. Unsafe Host Handling In Proxy

Location: `src/proxy.ts:13-24`, `src/proxy.ts:116-121`

Evidence:
- Raw `Host` header drives admin-subdomain detection and redirect construction.
- Checks use `startsWith("admin.localhost")` and `includes("localhost")`.

Impact: Self-hosted or mis-proxied deployments can misroute admin traffic or bypass main-domain admin redirects.

Fix:
- Parse `new URL(req.url).hostname`.
- Enforce exact host allowlists.
- Build redirects from configured canonical origins.

### 25. Redis Proxy Initialization Can Crash All Requests If Env Is Missing

Location: `src/proxy.ts:5-9`

Evidence:
- Proxy creates `new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: ...! })` at module load.

Impact: Missing Redis env can break routing/protection before the fail-open catch around emergency checks runs.

Fix:
- Use the same lazy env validation pattern as `src/lib/redis.ts`.
- Decide explicit fail-open/fail-closed behavior per feature.

### 26. Raw Headers Field Contains Full Raw Message

Location: `src/lib/email/HeaderParser.ts:170`

Evidence:
- `rawHeaders` is assigned `rawInput`.

Impact: A headers tab/export can include body and MIME attachment content, contrary to user expectations.

Fix:
- Store only the header block up to the first blank line.
- Keep full raw message in a separately named, gated field if required.

### 27. Header UI/Exports Read Case-Sensitively

Location: `src/components/email/analyzer/ResultsDashboard.tsx:123-124`

Evidence:
- CSV export reads `headers['Subject']` and `headers['From']`.
- PostalMime lowercases many header keys.

Impact: subject/sender can disappear from exports and tables.

Fix:
- Reuse `getHeaderValue` / `getFirstHeaderValue`.
- Normalize header keys at parse time for UI/export paths.

### 28. Attachment Hashing Runs Before Attachment Toggle

Location: `src/lib/email/HeaderParser.ts:164-201`

Evidence:
- `HeaderParser.parse()` always calls `analyzeAttachments()` and hashes attachment content.

Impact: Header-only analyses still spend time hashing attachments and may surface attachment artifacts outside the user's selected mode.

Fix:
- Move attachment hashing behind `checkAttachments`.
- Or pass parser options into `HeaderParser.parse()`.

### 29. Link Mismatch Detector Treats Plain Text With Dot As URL

Location: `src/lib/email/analysis/UrlAnalyzer.ts:116-118`

Evidence:
- `looksLikeUrl()` checks only for a dot and no spaces.

Impact: CTA text such as `here.` can be treated as a displayed domain and create false mismatch findings.

Fix:
- Strip trailing punctuation.
- Require URL parser success or a real hostname/TLD pattern.

### 30. Admin And Monitoring UI Uses Placeholder/Fabricated Operational States

Locations:
- `src/components/admin/SystemHealthIndicator.tsx`
- `src/app/api/admin/dashboard/stats/route.ts`
- `src/components/admin/AdminHeader.tsx`
- `src/app/admin/(dashboard)/monitoring/page.tsx`

Impact: Admins may trust fake degraded/healthy/critical states.

Fix:
- Source values from real telemetry.
- Render `unknown` or `unavailable` when no real signal exists.

### 31. Admin Dashboard Errors Are Hidden As Empty States

Locations:
- `src/components/admin/RecentActivityFeed.tsx`
- `src/components/admin/TopOrganizationsTable.tsx`
- `src/components/admin/TrendChart.tsx`
- `src/components/admin/VerdictPieChart.tsx`

Impact: Outages and authorization failures look like healthy empty systems.

Fix:
- Track `loading`, `error`, and `empty` separately.
- Show retry affordances and avoid positive security copy on failed loads.

### 32. Analysis Triage UI Is Optimistic Without Rollback

Location: `src/components/analysis/AnalystTriagePanel.tsx`

Impact: Analysts can see resolved/verified states that were never saved.

Fix:
- Await server results before committing UI state or implement rollback.
- Disable controls while saving and surface failures.

### 33. Admin Users UI/API DTO Mismatch

Locations:
- `src/app/admin/(dashboard)/users/users-client.tsx`
- `src/app/api/admin/users/route.ts`

Impact: Tables can show blank/undefined status, incorrect org counts, and misleading suspension actions.

Fix:
- Align the API DTO and client type.
- Render explicit unknown states.

### 34. CSP Still Allows Inline Scripts

Location: `next.config.ts:13-17`

Evidence:
- `script-src` contains `'unsafe-inline'`.

Impact: Any XSS bug has a larger blast radius, especially for an app that handles hostile email content.

Fix:
- Move to nonce/hash-based script allowances.
- Consider Trusted Types for risky DOM sinks.

### 35. Incident ID Model Collides Across Orgs

Locations:
- `prisma/schema.prisma:248`
- `src/actions/analysis.ts:121-143`
- `src/lib/incidents.ts:43-50`

Evidence:
- `incidentId` is globally unique.
- Every paid org starts at `#INC-1000` and increments a per-org counter.

Impact: Paid orgs can collide on `#INC-1001`; concurrent creates can duplicate IDs.

Fix:
- Use `@@unique([orgId, incidentId])`.
- Use atomic `increment` or a database sequence.

## P3 / Lower Priority

### 36. Auth Summary Overstates Missing Auth As Failure

Location: `src/components/email/AIAnalysisSummary.tsx:28-44`

Impact: Analysts see `none`/`neutral` as active failures rather than missing/inconclusive results.

Fix:
- Branch `pass`, `fail`, `softfail`, `none`, `neutral`, `temperror`, and `permerror` separately.

### 37. Utility Scripts Can Exit Successfully After Failures

Location: `scripts/audit-routes.ts`, several `scripts/*.ts` with `.catch(console.error)`

Impact: CI/release checks using these scripts may hide failures.

Fix:
- Throw on failed assertions or set `process.exitCode = 1`.

### 38. Node/Package Manager Policy Is Inconsistent

Locations:
- `package-lock.json`
- `.github/workflows/ci.yml.disabled`

Impact: CI/release builds are non-reproducible or fail under unsupported runtimes.

Fix:
- Add `engines` for Node >= 20.9.
- Add `.nvmrc` or `.node-version`.
- Use one package manager and frozen lockfile.

## Recommended Remediation Order

1. Fix P0/P1 security boundary issues: server action secret exposure, tenant isolation, admin RBAC, admin action auth.
2. Rotate/purge sensitive repo artifacts: password hashes, hardcoded admin credentials, user dumps, raw logs.
3. Fix entitlement correctness: Stripe event casting and usage quota enforcement.
4. Fix email correctness: DMARC `action=` normalization, ARC refund gating, AuthJourney label, macro OOXML scoring.
5. Re-enable CI with failing gates and dependency audit policy.
6. Isolate extension/Plasmo dependencies and reduce production dependency surface.
7. Clean up frontend/admin reliability issues: fabricated routes, placeholder operational state, hidden errors, DTO mismatches.

## Immediate Stop-Ship Criteria

Do not deploy this branch to production until at least these are fixed:

- `getDecryptedConfig` is removed from the server action surface.
- Analysis report and triage/comment access is scoped by `orgId`.
- Admin APIs/actions enforce admin session and role permissions.
- User dumps/hashes/hardcoded admin passwords are removed and credentials rotated.
- Stripe cancellation and quota bypass are patched.
- CI is restored with test, type, lint, and build gates.
