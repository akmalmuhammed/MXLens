# MXLens synthetic email corpus

A small, fully synthetic and labeled corpus of email messages for developing and
testing the MXLens phishing analyzer. It contains 24 phishing and 25 legitimate
`.eml` messages, several of the legitimate ones deliberately crafted to trip naive
heuristics (false-positive bait).

## Everything here is invented

- **No message is real.** Every header, body, sender and scenario was fabricated
  for testing. No real person, mailbox, or organization is represented.
- **Recipients** are always `@example.org` (the fictional receiving org, whose mail
  server is `mx.example.org`).
- **Person names** are generic inventions (Jordan Lee, Sam Okoye, Priya Nair, ...).

## Domain and address conventions

- **Legitimate brand mail** may use real brand domains (`paypal.com`, `github.com`,
  `microsoft.com`, `amazon.com`, `google.com`, `docusign.net`, `dhl.com`,
  `linkedin.com`, `slack.com`, `zoom.us`, `dropbox.com`, `atlassian.net`) because
  genuine mail really originates from them. Generic legitimate senders use
  `example.com` / `example.net` / `example.co.uk`.
- **Attacker domains** are invented lookalikes or throwaway-looking domains, e.g.
  `paypa1-secure-login.com`, `mailbox-helpdesk.info`, `account-verify-center.xyz`,
  `secure-billing-update.info`, `docusign-envelope-review.top`. One homograph case
  uses punycode (`xn--paypl-7ve.com`, a Cyrillic-a spoof of paypal).
- **IP addresses** come only from documentation ranges (`192.0.2.0/24`,
  `198.51.100.0/24`, `203.0.113.0/24`) and private ranges (`10.0.0.0/8`) for
  internal hops.
- **Authentication-Results** always use the authserv-id `mx.example.org` (the
  recipient's server). Phishing messages carry results consistent with their
  technique: spoofs of real brands fail SPF/DKIM/DMARC, while lookalike and
  throwaway domains often *pass* auth for their own domain (that pass is the point).
- DKIM-Signature `b=` values are fake base64 placeholders and do not verify.

## Attachments

All attachment bytes are harmless placeholders. "Dangerous" cases carry the literal
text `MXLENS TEST FILE - NOT EXECUTABLE` or similarly inert bytes:

- `invoice.pdf` whose bytes begin with `MZ` (magic-byte mismatch) is not a real
  executable, only placeholder text after the magic bytes.
- `report.docm`, `invoice.pdf.exe`, the U+202E right-to-left-override name, the
  `.js` file, and the password-protected `.zip` lure all contain inert text, not
  code or macros.
- Legitimate `invoice_NW-20260122.pdf` begins with `%PDF-1.7` then placeholder text.

No QR code images are included.

## Layout

```
corpus/
  phishing/      NN-short-slug.eml   (24 messages)
  legitimate/    NN-short-slug.eml   (25 messages)
  labels.json    machine-readable labels and technique tags
  README.md      this file
```

## labels.json

```json
{
  "version": 1,
  "description": "...",
  "messages": [
    {"file": "phishing/01-....eml", "label": "phishing",
     "techniques": ["spoofed-domain", "dmarc-fail"], "notes": "one sentence"},
    {"file": "legitimate/01-....eml", "label": "legitimate",
     "tricky": ["shortener", "esp-return-path"], "notes": "..."}
  ]
}
```

Technique tags used for phishing (and `tricky` hints for legitimate false-positive
bait): `spoofed-domain`, `dmarc-fail`, `lookalike-domain`, `homograph`,
`display-name-address`, `brand-display-name`, `freemail-bec`, `reply-to-mismatch`,
`link-text-mismatch`, `brand-in-subdomain`, `ip-url`, `url-shortener`,
`open-redirect`, `credential-form`, `html-attachment`, `dangerous-attachment`,
`double-extension`, `rtlo`, `magic-mismatch`, `macro`, `encrypted-archive`,
`fake-reply`, `payment-change`, `data-uri`, `hidden-text`, `callback`, `urgency`.

## Adding a message

1. Write a new `.eml` under `phishing/` or `legitimate/` following the naming
   pattern `NN-short-slug.eml`. Keep line endings CRLF, headers RFC 5322 valid,
   dates in-era, and use only the domain/IP conventions above.
2. Add a matching entry to `labels.json` with its `file`, `label`, technique/tricky
   tags, and a one-sentence `notes`.
3. Re-run the validator so every file has a label and every label has a file.

## Contributions

**Real emails are not accepted.** This corpus is intentionally 100% synthetic so it
can be shared and redistributed freely without exposing anyone's mail. Please do not
submit real messages, real addresses, or redacted real samples — contribute only
newly invented messages that follow the conventions above.
