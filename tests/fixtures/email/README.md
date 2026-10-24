# Email test fixtures

Every file here is **synthetic**. Domains use the reserved `example.com` / `example.org` /
`example.net` names (RFC 2606) and IPs come from documentation ranges (RFC 5737), so
no real person, mailbox or organization appears in the test suite.

Do not add real emails here, even redacted ones. If a real message shows a detection
gap, reproduce the relevant headers or body in a new synthetic file instead.

| File | Scenario |
| --- | --- |
| `arc-forwarded-list.eml` | Mailing-list forward: SPF softfail, DKIM fail, DMARC fail at the final hop; ARC chain passes with original SPF and DKIM pass |
