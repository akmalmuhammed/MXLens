# Security Remediation and Next-Build Handoff

Updated: 2026-10-25
Baseline: docs/engineering-audit-2026-05-01.md
Scope: targeted fixes applied to the current main line; this does not close the full 38-item baseline audit.

## Implemented in this change

- Removed decrypted integration config from the "use server" action surface. The helper now lives in a server-only module used by server handlers.
- Scoped analysis detail, triage reads, and comment writes to the caller's organization. Comment creation and ownership lookup share a transaction.
- Required the isolated admin session and SUPER_ADMIN role for emergency actions and security data reads. Admin user/org write APIs now check roles; support admins retain the explicitly scoped member-management operation.
- Replaced the arbitrary-follow SSRF fetch with manual, bounded redirects, DNS resolution checks, public-address validation, and an address-pinned HEAD request for each hop.
- Required timestamped HMAC-SHA256 signatures for integration webhooks; added rate limiting, a 64 KiB body cap, field bounds, and duplicate-event handling. Clients sign timestamp + "." + rawBody and send x-webhook-timestamp (Unix milliseconds) plus x-webhook-signature: sha256=<hex>.
- Corrected Stripe subscription-deletion event handling to use the subscription object's ID.
- Normalized enforced DMARC actions, restricted ARC penalty refunds to origin SPF/DKIM passes, corrected the DMARC UI verdict, and recognized macro-enabled OOXML containers.
- Made raw-header output stop at the header/body separator, honored the attachment-analysis option before hashing, and made CSV header lookups case-insensitive.
- Disabled the fabricated ID-derived analysis result page. The route now returns not-found until it can serve a persisted result.
- Changed incident IDs to be unique per organization, with atomic counter increments and a migration.
- Removed raw email corpus, user exports, admin bootstrap/reset scripts, build/test diagnostics, and the public WASM source map from the current tracked tree. The local corpus is ignored and preserved on this machine; CI now uses synthetic fixtures.
- Re-enabled CI with Prisma validation/generation, TypeScript, lint, unit tests, and a production build. CI-only environment values are placeholders, not deployment secrets.
- Removed analysis-action logs that printed subject/sender fields.

## Next build checklist

1. **Set webhook credentials before enabling integrations.** Each integration config must contain a high-entropy secret; webhook senders must implement the timestamped HMAC format above. Old clients using only x-webhook-secret will receive 401 until updated.
2. **Apply the database migration before deploying app code:** npx prisma migrate deploy. It replaces global incident-ID uniqueness with (orgId, incidentId) uniqueness and uses atomic organization counters.
3. **Rotate credentials and review repository history.** Removing files from the current tree does not erase prior commits. If any committed admin password, password hash, email dump, or credential was live or shared, rotate it. Perform a coordinated history purge only after repository collaborators and deployment references are prepared.
4. Run the CI workflow on the deployment candidate. Current local verification with CI-only placeholder environment values: Prisma schema validation passed; TypeScript passed; production build passed; unit tests passed (38 passed, 2 skipped); lint exited successfully with 314 warnings. CI remains the deployment-candidate gate.
5. Confirm production secrets and provider settings through the deployment secret manager. Never copy the CI placeholders into the deployed environment.

## Still open from the baseline audit

- **Quota policy:** there is no defined finite plan quota in product configuration (PLAN_DAILY_ANALYSIS_LIMITS currently uses effectively unlimited values). Set approved plan limits before enforcing a cap consistently across UI, batch, and API persistence.
- **Dependency exposure:** Plasmo remains in root dependencies, .npmrc still enables legacy peer resolution, and dependency-audit findings need package-by-package review before adding an npm audit failure gate.
- **CSP:** script-src still includes unsafe-inline; move to a nonce/hash policy with a browser-tested rollout.
- **Rate limiting:** login and password-reset throttling still need per-IP/per-account controls.
- **Admin UX and data quality:** audit findings about placeholder monitoring states, hidden error/empty states, DTO alignment, and optimistic triage need individual UI/API tests.
- **Full audit verification:** remaining medium/low findings and end-to-end tenant/RBAC/webhook tests need a dedicated pass. The current passing unit suite does not establish production readiness by itself.
