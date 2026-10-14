# Contributing to MXLens

Thanks for helping make email safer to read. The most valuable contribution you
can make is a **new detection rule with test fixtures**, or a **hard case the
current rules get wrong**.

## Ground rules

- **Never commit real email.** Everything in `corpus/` and in tests is synthetic:
  `example.com` / `example.org` / `example.net` domains (RFC 2606) and
  documentation IPs `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`
  (RFC 5737). CI runs a secret scan and will fail on anything that looks like real
  credentials or data.
- **No working attack toolkits.** Fixtures demonstrate a *detection*, with inert,
  placeholder attachment bytes — never real malware, macros, or runnable payloads.
- Keep the engine dependency-light and free of network calls. Anything that
  reaches the network belongs in an app or an opt-in plugin, not in the engine.

## Setup

```bash
npm install          # Node 20+
npm test             # engine, CLI and MCP tests
npm run eval         # accuracy report over corpus/
npm run typecheck
```

## Adding a detection rule

1. Add the rule to the right file in `packages/engine/src/rules/`
   (`identity.ts`, `links.ts`, `attachments.ts`, `content.ts`, `headers.ts`,
   `authentication.ts`). Give it a new id in that file's series (e.g. `LINK-011`).
2. Fill in the `meta`: a clear `title`, `category`, max `severity`, the ATT&CK
   technique(s) from `ATTACK` in `rules/rule.ts`, a one-paragraph `description`,
   and an honest `falsePositives` note.
3. Return at most one `finding` per message; attach the **exact evidence** you
   saw and keep the `summary` to one sentence an analyst could paste into a ticket.
4. Register it in the file's exported `*Rules` array (it flows into
   `packages/engine/src/rules/index.ts` automatically).

### Every rule needs two fixtures

Add to `corpus/`:

- **A positive** in `corpus/phishing/` that your rule should catch.
- **A negative** in `corpus/legitimate/` that resembles the positive but is
  benign — this is what keeps the rule from over-firing.

Then add both to `corpus/labels.json` with the technique tags, and run:

```bash
npm run eval
```

The accuracy gate (recall ≥ 90%, false-positive rate ≤ 10%) must still pass. If
your rule drops a legitimate message, tighten it rather than lowering the gate.

Also add a focused unit test in `packages/engine/test/` that asserts the specific
behavior (see `analyze.test.ts` for the pattern) — fixtures prove the end-to-end
verdict, unit tests pin the rule's logic.

## Pull requests

- Keep PRs focused; one rule or one fix at a time is easiest to review.
- `npm test` and `npm run eval` must pass. CI runs both plus a type check,
  a `next build`, and a secret scan.
- Sign your commits off with `git commit -s` (Developer Certificate of Origin).
- Describe the real-world case your change addresses, with a synthetic example.

By contributing, you agree your contribution is licensed under Apache-2.0.
