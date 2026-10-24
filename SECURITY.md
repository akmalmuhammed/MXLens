# Security policy

## Reporting a vulnerability

Please report security issues privately through GitHub:
**Security → Report a vulnerability** on this repository. Do not open a public issue.

Include what you found, how to reproduce it and the impact you expect. You should get a
response within 7 days.

## Scope

In scope:

- Code execution, XSS or HTML injection through a crafted email (the analyzer renders
  untrusted content).
- Anything that causes email content, attachments or indicators to leave the browser when
  enrichment is off.
- Server-side request forgery or abuse of the enrichment endpoints.
- Vulnerabilities in the CLI when processing untrusted files.

Out of scope:

- Phishing emails that MXLens scores incorrectly. Those are detection issues; please open a
  normal issue with a sanitized sample (see [CONTRIBUTING.md](CONTRIBUTING.md)).
- Issues in self-hosted deployments caused by their own configuration (for example, exposing
  enrichment publicly without a reverse proxy).

## Supported versions

Only the latest release receives fixes.
