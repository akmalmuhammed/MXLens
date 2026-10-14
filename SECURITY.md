# Security Policy

## Reporting a vulnerability

Please report security issues privately. Do **not** open a public issue.

Use GitHub's private vulnerability reporting:
**https://github.com/akmalmuhammed/mxlens/security/advisories/new**

Include what you found, how to reproduce it, and the impact you expect. You will
get an acknowledgement within a few days. Once a fix is available, we will credit
you in the release notes unless you prefer otherwise.

## Scope

MXLens parses untrusted email. The highest-value reports are:

- A crafted message that crashes the engine, hangs it (catastrophic
  backtracking, pathological input), or exhausts memory.
- A way to make the **safe preview** execute script, load remote content, or
  escape its sandbox.
- A parsing flaw that lets a message evade detection in a way that generalizes
  (not a single hand-tuned sample), or that produces a confident wrong verdict.
- Any issue in the REST API that lets input be stored, exfiltrated, or used to
  reach internal network resources (SSRF).

## Not in scope

- Reputation/enrichment services — MXLens does not call them by default.
- Findings you disagree with on a single sample; open a normal issue with the
  message (synthetic, no real data) so it can become a test fixture.

## Handling test material

Never attach real phishing emails containing real people's data. Reduce any
report to a synthetic reproduction using `example.com`/`example.org`/`example.net`
(RFC 2606) and documentation IP ranges (RFC 5737).
