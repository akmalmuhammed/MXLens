# Launch checklist

Private: excluded from the public export by `.gitattributes`.

The public repository keeps the name `akmalmuhammed/mxlens` but starts from a single fresh
commit. This private repository's history contains user dumps, password hashes and the Neon
connection string, so it must never become public, and it cannot simply be cleaned: GitHub
keeps pull-request refs (for example PR #1) that would still expose old commits.

## 1. Merge the open-source work

- [ ] Merge `claude/eloquent-dijkstra-hwl9kx` into `main` of this private repo.
- [ ] Close PR #1 (its fixes are included; every surface it patched has been removed).

## 2. Free the name and create the public repo

GitHub settings, in this order:

- [ ] Rename this repo: **Settings → General → Repository name** → `mxlens-saas-archive`.
      Keep it private.
- [ ] Create a new **public** repo named `mxlens` under `akmalmuhammed`. Leave it empty (no
      README, license or .gitignore).
- [ ] Export and push from an up-to-date checkout of this repo's `main`:

  ```bash
  scripts/export-public-repo.sh ../mxlens-public
  cd ../mxlens-public
  git remote add origin git@github.com:akmalmuhammed/mxlens.git
  git push -u origin main
  git tag v0.1.0 && git push origin v0.1.0   # after step 3
  ```

  The script refuses to export if it finds database URLs, private keys, bcrypt hashes, a
  personal email address or stray `.eml` files, and runs gitleaks if it is installed.

## 3. Configure the public repo

- [ ] **Settings → General**: description "Open-source email phishing analyzer. Runs in your
      browser.", website, topics (`phishing`, `email-security`, `eml`, `dmarc`, `soc`,
      `threat-analysis`).
- [ ] **Settings → Code security**: enable private vulnerability reporting (SECURITY.md points
      to it), Dependabot alerts and security updates, secret scanning and push protection.
- [ ] **Settings → Branches**: protect `main` (require PRs and the CI checks).
- [ ] **Settings → Secrets → Actions**: add `NPM_TOKEN` (an npm automation token).
- [ ] Create the npm account or org that will own the `mxlens` package (the name is free as of
      2026-10-24).
- [ ] Push the `v0.1.0` tag. The Release workflow publishes `mxlens` to npm and
      `ghcr.io/akmalmuhammed/mxlens` to GitHub Container Registry.
- [ ] After the first image push: **Packages → mxlens → Package settings** → make it public.

## 4. Switch the live site to the open-source demo

- [ ] In Vercel, connect the project to the new public repo (or create a new project from it).
- [ ] Delete every environment variable from the Vercel project. The demo needs none:
      `DATABASE_URL`, `DIRECT_URL`, Clerk, Stripe, Upstash, Resend, Sentry and PostHog keys all
      go. Leave `MXLENS_ENRICHMENT` unset so the public demo makes no third-party calls.
- [ ] Deploy and check `/analyze` with the demo samples.
- [ ] Remove the `admin.` subdomain from Vercel and DNS.

## 5. Shut down the SaaS services

Nothing in the open-source code uses these any more.

- [ ] **Stripe**: cancel active subscriptions (refund as appropriate), then deactivate
      products and webhooks.
- [ ] **Users**: if you want to tell existing users, export their email addresses from Neon
      first, send one notice, then delete the export.
- [ ] **Neon**: delete the project. This also makes the leaked connection string in the old
      history useless. If you keep it for a while, rotate the password now.
- [ ] **Clerk, Upstash, Resend, Sentry, PostHog**: delete the apps/projects and revoke keys.
- [ ] Rotate or revoke any integration credentials (Jira, webhooks) customers stored.

## 6. Announce

- [ ] Show HN: "MXLens – open-source phishing analyzer for .eml files that runs in your browser"
- [ ] r/netsec, r/blueteamsec, r/sysadmin, r/msp
- [ ] Product Hunt; security newsletters (tl;dr sec, Risky Biz)
- [ ] Post the CLI one-liner: `npx mxlens suspicious.eml`
