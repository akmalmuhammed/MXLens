# MXLens Detection Audit — October 2026

A rule-by-rule review of the MXLens engine against current phishing tradecraft, including AI-driven attacks, with the fixes made in this change and the gaps that remain.

- **Scope:** every scorer (`src/lib/email/scoring/`) and detector (`src/lib/email/detection/rules/`), the signal normalizer, URL analysis and the report layer.
- **Method:** read each rule and check it against Microsoft's Q1 2026 email threat data, Zscaler ThreatLabz 2026, and recent write-ups on device-code phishing, Direct Send, DKIM replay and prompt injection (sources at the end). Then add a positive and a negative test for every change.
- **Constraint kept:** the engine stays offline and deterministic. It makes no network calls, uses no ML model and adds no new dependencies.

## 1. What attackers do now (2026)

| Trend | Evidence | Why it beats a classic filter |
|---|---|---|
| **Payloads that open in the browser.** HTML, SVG and PDF attachments | Microsoft Q1 2026 payload mix: HTML 31%, PDF 28%, SVG 19%, DOC/DOCX 12%, URL 10% | No link in the email body; the "page" runs locally |
| **AiTM kits** (Tycoon2FA, Kratos/Sneaky2FA, EvilTokens) | 89–95% of payload attacks are credential phishing | Steal the session cookie, so MFA codes don't help |
| **Device-code and OAuth consent phishing** | Push Security tracks 12+ device-code kits in 2026 | The link points to a *real* Microsoft/Google page |
| **ClickFix / FileFix** (fake CAPTCHA, "paste this into Win+R") | CAPTCHA-gated phishing up 125% in March 2026 | The user runs the malware; there is nothing to download |
| **QR phishing** | Up 146% Jan→Mar 2026; 65–70% of it inside PDFs; text-drawn and table-drawn QR codes | Moves the click to a phone and past link protection |
| **Living off trusted sites** | 37k malicious sites built with AI site builders (Lovable, Manus, ...); kits fronted on Workers, Vercel, GitHub Pages | Clean domain reputation and valid TLS |
| **Direct Send / self-domain spoofing** into Microsoft 365 | Varonis and Abnormal 2025–26 campaigns | Mail claims to be internal, often from the user to themselves |
| **Genuine-notification abuse / DKIM replay** | Google OAuth app-name replay (2025) | SPF/DKIM/DMARC pass because the platform really signed it |
| **BEC with no link and no attachment** | 82–84% start with a conversational opener; gift-card requests up 108% in March 2026 | Nothing to scan; pure social engineering |
| **Callback phishing (TOAD)** with AI-voiced agents | Billing/renewal lures with only a phone number | No URL at all |
| **Prompt injection against AI email assistants** (Copilot, Gemini) | Permiso, 0DIN, Barracuda 2025–26 | Hidden text steers the AI summary into showing a fake alert |
| **AI-written lures** | All vendor reports | Perfect grammar, so spelling checks stop working |

## 2. Audit of existing detectors

Status: ✅ fixed in this change · ⚠️ improved, limits remain · 🔲 open (see section 5).

### Authentication and routing (`HeaderScorer`, `Authentication.ts`)

| Finding | Status |
|---|---|
| A gateway in front of Microsoft 365 made the final `spf=pass` hide the real sender's failure | ✅ previous change (origin-aware auth) |
| `dmarc=bestguesspass` treated as an unknown result | ✅ previous change |
| `compauth=fail` (Microsoft's own spoof verdict) was ignored | ✅ now **-15** with the reason code |
| Direct Send (anonymous delivery to `<tenant>.mail.protection.outlook.com`) not named | ✅ self-domain rule now says so, and flags mail the user sent to themselves |
| DKIM replay / signed-notification abuse not considered | ✅ new `NotificationAbuse` rule |

### `ImpersonationScorer` (display-name brand/role)

| Finding | Status |
|---|---|
| **False positive:** substring match, so "Christopher" contained `hr`, "Ceola" contained `ceo`, and "Appleby" contained `apple`. Any free-mail user with such a name got **-80, critical** | ✅ whole-word matching |
| **Bypass:** authorized-domain check used `endsWith`, so `notmicrosoft.com` passed as `microsoft.com` | ✅ label-boundary check |
| Microsoft's real sending domains missing (`microsoftonline.com`, `sharepointonline.com`, the `.microsoft` TLD), causing false positives | ✅ added |
| **False positive:** the generic role "support" had an empty allowed-domain list, and `[]` is truthy, so every helpdesk ("Acme Support <help@acme.com>") got **-80, critical** | ✅ empty list now means "generic role", so it is only suspicious from free mail |

### `HomographDetector` / `Typosquatting`

| Finding | Status |
|---|---|
| **Dead code:** the Punycode check sat behind a "contains non-ASCII" gate, but `xn--` is ASCII, so it never ran | ✅ |
| Only checked Punycode at the start of the domain (`login.xn--pypal-4ve.com` passed) | ✅ any label |
| Cyrillic only; Greek, Armenian and Cherokee confusables were missed | ✅ |
| Bidirectional control characters were not checked | ✅ |
| Typosquat list is brand-only and From-only; it never compared against **the recipient's own company** | ✅ new `OrgLookalike` rule (sender, Reply-To, Return-Path and links) |

### `IpUrlDetector`

| Finding | Status |
|---|---|
| **Bug:** a global (`/g`) regex used with `.test()` keeps `lastIndex` between calls, so every other IP link was skipped | ✅ |
| Private/RFC1918 ranges were "skipped" in a comment but not in code | ✅ |
| Ports and query strings broke the body-level IP check (`http://1.2.3.4:8080`) | ✅ |
| Decimal, hex and octal IPs (`http://3232235777/`) and IPv6 literals were missed | ✅ new `UrlObfuscation` rule |

### `UrlAnalyzer` / `LinkObfuscation` / `OpenRedirect`

| Finding | Status |
|---|---|
| **False positive:** brand matched as a substring of the hostname, so `purchase.store.example` was flagged as "chase" subdomain trickery | ✅ token match |
| Official-domain check also used substring matching (`paypal.com.evil.example` counted as official) | ✅ |
| Redirectors matched on the whole URL string, so a domain in a query string counted; `t.co` also matched `t.consulting.example` | ✅ host and path matching |
| Missing redirectors: Google AMP (`/amp/s/`), `googleadservices`/DoubleClick `adurl`, YouTube redirect, `l.facebook.com`, DuckDuckGo | ✅ added |
| `google.com/url?q=` ignored | ✅ previous change |
| Shortener list was dated | ✅ about 20 added (`t.ly`, `rb.gy`, `cutt.ly`, `qrco.de`, ...) |
| `user@host` URLs (`https://login.microsoftonline.com@evil.example`) and `javascript:`, `data:`, `search-ms:`, `ms-msdt:` and UNC (`\\host\share`, NTLM leak) links were not checked | ✅ new `UrlObfuscation` rule |

### Body content (`SignalNormalizer`, `BodyScorer`, `ContentUrgency`, `SpellingGrammar`, `CredentialForm`)

| Finding | Status |
|---|---|
| **False positive:** hidden-text rule fired on white button text or any `display:none` whenever the email used words like "verify". This was **-30 on the bundled demo**, from its red "VERIFY NOW" button. Hidden preheaders and mobile-only blocks in normal newsletters hit it too | ✅ now flags ZeroFont word-splicing, hidden text that itself carries lure wording, or hidden "salting" larger than the visible text |
| **False positive:** any `action="..."` attribute (e.g. `data-action`) counted as an embedded login form (**-40, critical**) | ✅ only `<form>` or a password input |
| **Bug:** `"account"` was in the misspelling list | ✅ removed |
| Spelling rule read only the text part, so HTML-only mail was skipped | ✅ uses visible text; weight stays low by design (AI-written lures are fluent) |
| Urgency/credential checks ran on raw HTML; HTML-only mail was missed | ✅ previous change |

### `ThreadScorer` (fake reply)

| Finding | Status |
|---|---|
| Only `Re:`, `Fwd:`, `Fw:`, `AW:`; the documented `SV:` was not implemented | ✅ adds WG, SV, VS, VB, Antw, Doorst, TR, RIF, RV, ODP, PD, 回复/转发 and `Re[2]:` |
| **False positive:** forwards (`FW:`, `Fwd:`, `WG:`, `TR:`...) without `In-Reply-To` got **-75, critical** as "fake replies", but forwards normally have no threading headers (Gmail and many clients never add them), so ordinary forwarded mail was hit | ✅ rule now applies to reply prefixes only |
| **-75 critical** for a missing `In-Reply-To` is harsh for ticketing systems that send "RE:" notifications without threading headers | 🔲 weight unchanged; consider -40 with an allowlist |

### Attachments (`AttachmentScorer`, normalizer)

| Finding | Status |
|---|---|
| **SVG was not covered at all** (19% of malicious payloads in Q1 2026) | ✅ new `MarkupAttachment` rule |
| HTML attachments got a flat -60 with no look inside; smuggling, Telegram exfil, redirects and password forms were not distinguished | ✅ `MarkupAttachment` (-45 for strong traits) |
| Missing high-risk types: `.hta`, `.msc` (GrimResource), `.cpl`, `.msi(x)`, `.appx`, `.xll`, `.chm`, `.scf`, `.reg`, `.jnlp`, `.one`, `.wsf`, `.vbe`, `.jse`, `.iqy`, `.slk`, `.library-ms`, `.search-ms`, `.settingcontent-ms` | ✅ |
| Right-to-left override filenames (`invoice‮fdp.exe` shows as `invoiceexe.pdf`) | ✅ **-70 critical** |
| Double-extension decoys limited to 8 types | ✅ broadened |
| The recipient's address (plain or Base64) in an attachment name, and voicemail/fax pretexts on HTML/SVG | ✅ new `AttachmentLure` rule |
| **CLI blind spot:** PDF link extraction only ran in the browser (pdf.js), so the CLI never saw PDF links | ✅ new dependency-free `/URI` extractor (plain and Flate-compressed objects) runs everywhere |

### `QuishingDetector`

| Finding | Status |
|---|---|
| Image QR decoding only ran in the browser; the CLI and server never decoded QR codes | ✅ ZXing-C++ (WebAssembly, `zxing-wasm`) decodes in the browser, Node and the CLI. The wasm is bundled; it is never fetched from a CDN |
| **Missed real kit QR codes:** jsQR-based scanners (`qr-scanner` fallback, jsQR) failed on dense, error-correction-H QR codes with no quiet zone from a live 2026 DocuSign campaign; ZXing reads them | ✅ ZXing is now the primary decoder |
| Decompression-bomb images (tiny file, huge declared size) could exhaust memory | ✅ PNG/JPEG/GIF/BMP dimensions checked first (25 MP cap) |
| QR codes inside PDFs (most QR volume) are not decoded | 🔲 needs PDF rendering |
| QR codes drawn with Unicode blocks or HTML table cells defeat image scanners entirely | ✅ new `QrLure` rule |
| "Scan the QR code to sign in" lure wording | ✅ `QrLure` (skips verified internal IT mail) |
| QR URLs were pushed into the signals after the other link detectors had already run in parallel, so they missed them | ✅ QR decoding moved into normalization, before any detector, so every link rule sees QR URLs; the report tags them "From QR code" |
| Non-URL QR payloads (tickets, Wi-Fi) were penalized like phishing links | ✅ only URL payloads count |

### Sender identity (`DisplayNameSpoofing`, `ReplyToMismatch`, `CrossContextScorer`)

| Finding | Status |
|---|---|
| Sender names stuffed with domains/URLs (`"awstrack.me" <x@other>`), per Microsoft Q1 2026 | ✅ -10 |
| BEC (gift cards, payroll diversion, bank-detail change, conversational opener) only partly covered by keyword urgency | ✅ new `BecRequest` rule |
| The free-provider list differs between rules (`ReplyToMismatch` has 5 providers, `Config` has 15) | 🔲 consolidate |

### Attached emails, brand templates and submission path (added after a live campaign review)

A real DocuSign-themed QR campaign (October 2026) came out **Clean, risk 14, high confidence**. The delivered message was only a confidentiality notice, and the lure travelled as an attached `.eml` that MXLens never opened.

| Finding | Status |
|---|---|
| Attached emails (`message/rfc822`, `.eml`) were never opened, so their body, links and images were invisible | ✅ opened recursively (depth 3, 10 messages, 15 MB) and merged into the analysis |
| "Email inside an email" evasion: a disclaimer-only wrapper, an attached email forged from the recipient's own domain (`hr@<your org>`), and an attached email with no `Received` headers (crafted, never sent) | ✅ new `embedded-message` rule. A colleague forwarding a real message with "FYI" is not flagged |
| DocuSign/Microsoft/Adobe/Dropbox **templates** reused by other senders, often hot-linking the brand's own logo CDN | ✅ new `brand-template` rule (asset hosts and template ids only; a logo alt text alone is too common for Microsoft) |
| "Via DocuSign" display names from non-DocuSign domains | ✅ DocuSign, Dropbox, WeTransfer, Adobe Sign, OneDrive and SharePoint added to brand display-name checks |
| Display names padded with a long random token (`... dse_NFCaERNSW...`) | ✅ -10 |
| Sent by logging in to an unrelated mailbox (`Authenticated sender: info@other-domain`), often with a `[127.0.0.1]` HELO from a public IP | ✅ new `submission-anomaly` rule |
| Attachment names containing the recipient's mailbox name (`QR_alice.smith.png`) | ✅ |
| A file with no delivery headers at all was scored as four separate failures (-75): missing SPF, DKIM, DMARC and Received | ✅ one "No Delivery Headers" finding (-25); the content decides |
| **False positive:** forwards (`FW:`/`Fwd:`) were "fake replies" at -75 critical | ✅ see ThreadScorer above |
| **False positive:** a second copy of the role-keyword check (report identity panel) matched `hr` inside words and random tokens, and had a `subport` typo | ✅ whole words |

## 3. New detectors

| Detector | Catches | Impact |
|---|---|---|
| `device-code-oauth` | Device-code login lures (`microsoft.com/devicelogin`, `aka.ms/devicelogin`, `google.com/device`) with a code; OAuth consent links asking for mail, file or offline scopes | -25 / -35; consent -15 / -30 |
| `clickfix` | "Open Win+R / terminal / Explorer" **and** "paste", or a fake human check; PowerShell `-enc`, mshta, `curl\|sh`, clipboard writes, in the body or in HTML/SVG attachments | -50 with a command, -30 for instructions, -15 for a command alone |
| `markup-attachment` | HTML/SVG attachments with SVG scripts, redirects, HTML smuggling, Telegram/Discord/PHP exfiltration, password fields, obfuscation, or the recipient's address embedded | -45 strong / -20 |
| `attachment-lure` | Recipient address (plain or Base64) in a filename; voicemail/fax/remittance pretext on HTML/SVG; audio pretext on PDF | -10 to -30 |
| `qr-lure` | QR drawn with block characters or table cells; "scan to sign in" plus an image | -30 / -15 |
| `url-obfuscation` | `user@host` tricks, `javascript:`/`data:`/`vbscript:` and protocol-handler links, UNC paths, numeric-IP and IPv6 hosts | -20 to -45 |
| `hosting-abuse` | Tunnels (trycloudflare, ngrok, devtunnels), free hosting and serverless (pages.dev, workers.dev, vercel.app, web.app, ...), AI site builders (lovable.app, manus.space, ...), Google Sites/Forms, abuse-heavy TLDs | Tunnel -20; hosting -5, or -15 with a sign-in lure; TLD -5 / -10 |
| `org-lookalike` | Sender, Reply-To, Return-Path or link domains imitating **the recipient's company** (TLD swap, one-character typo, name plus extra words) | -15 to -30 |
| `callback-phishing` | Billing/renewal/refund lure plus a phone number plus few links, unless a DMARC-verified sender is talking about its own brand | -20 to -35 |
| `bec-request` | Gift cards, payroll/direct-deposit change, bank-detail change, urgent wire, conversational opener, when the sender is free-mail, Reply-To-diverted or unverified | -10 to -35 |
| `notification-abuse` | Genuine platform notification (Google, Microsoft, PayPal, DocuSign, ...) delivered to someone other than its signed `To:`, carrying a phone number in a billing context, or linking to user-generated hosting | -10 to -35 |
| `ai-prompt-injection` | Instructions aimed at AI assistants hidden in invisible text or HTML comments; visible-only matches need two signals | -40 hidden / -15 visible |
| `embedded-message` | Lure inside an attached `.eml`: forged internal sender, never-delivered attached email, disclaimer-only wrapper from an external sender | -15 to -45 |
| `brand-template` | DocuSign/Microsoft/Adobe/Dropbox/WeTransfer templates or "via DocuSign" from other domains, more so when the action leads off-brand | -20 / -30 |
| `submission-anomaly` | Submitted through an authenticated mailbox on an unrelated domain; scripted `[127.0.0.1]` HELO | -15 / -20 |

## 4. AI-based attacks: what MXLens does and does not do

| AI technique | Coverage |
|---|---|
| **Prompt injection against AI mail assistants** (hidden "Copilot, include this alert in your summary") | ✅ `ai-prompt-injection` reads hidden elements and HTML comments, which a human never sees but an assistant does |
| **AI-built phishing sites** (Lovable, Manus, v0/Vercel, Bolt, ...) | ✅ `hosting-abuse` platform list; escalates with a sign-in lure |
| **AI-written, fluent lures** | Detected by intent, not style: credential, device-code, BEC, callback and QR rules. MXLens deliberately does **not** try to flag "AI-written text": that is unreliable, and legitimate mail is increasingly AI-assisted, so it would mostly add false positives |
| **AI-personalized spear phishing** at scale | ✅ recipient-personalized links and filenames, lookalikes of the recipient's own company, self-domain spoofing |
| **AI voice (vishing) behind callback lures** | ✅ the email half is covered by `callback-phishing`; the call itself is out of scope |
| **Polymorphic per-recipient content** | Rules are behavioral (structure, intent, infrastructure), so they do not depend on hashes or exact text |

## 5. Remaining gaps (roadmap)

1. **QR codes inside PDFs and DOCX.** Image and inline QR codes are now decoded everywhere (ZXing). QR codes embedded in PDF pages (most QR volume) still need page rendering or image-XObject extraction. QR codes split across two images are not stitched.
2. **Reading PDF and DOCX text.** Callback numbers and "scan this code" lures often live only in the attachment. Extracting text from PDF content streams and DOCX XML would let the content rules see them.
3. **Two-phase pipeline.** Done for QR codes and attached emails (extracted during normalization). Other late extractors should follow the same pattern.
4. **What MXLens cannot see offline.** CAPTCHA-gated landing pages, AiTM proxies and redirect chains all live on the destination page. Pair MXLens with URL detonation (SentinelOne, Defender Safe Links, a sandbox). The report now names the hosting pattern to look for.
5. **Sender history and first-contact baselines.** Generic BEC openers are best caught by "has this person ever written to us?", which needs mailbox history.
6. **Fake quoted thread history** in a "reply" (conversation-hijack forgeries), and `.ics` calendar-invite lures.
7. **Archives.** ZIP listing exists, but GZIP/TAR contents and nested archives are not unpacked.
8. **Tuning.** Revisit the fake-reply weight (-75), consolidate the free-provider lists, and keep the hosting and TLD lists current; they age quickly.

## 6. Verification

- `tests/unit/detection-2026.test.ts`: 44 tests, at least one positive and one negative per new rule and per fix.
- `tests/unit/legit-regressions.test.ts`: 8 legitimate-mail shapes the new rules must leave alone. These include an order confirmation with a phone number, a newsletter with hidden preheaders, verified IT MFA enrollment with a QR code, a Google Calendar invite with dial-in numbers, remittance and eFax PDFs, a dev newsletter linking to github.io/vercel.app, and a security newsletter that quotes "Win+R" and "ignore previous instructions".
- The bundled demo phishing sample stays malicious (risk 75; 86 before, because the false-positive "hidden text" penalty is gone). The demo legitimate sample stays clean.

## Sources

- [Microsoft: Email threat landscape, Q1 2026](https://www.microsoft.com/en-us/security/blog/2026/04/30/email-threat-landscape-q1-2026-trends-and-insights/)
- [Zscaler ThreatLabz 2026 Phishing and Initial Access Report](https://www.zscaler.com/blogs/security-research/one-click-compromise-threatlabz-2026-phishing-and-initial-access-report)
- [Push Security: device code phishing in 2026](https://pushsecurity.com/blog/device-code-phishing)
- [Permiso: prompt injection in Copilot email summaries](https://permiso.io/blog/copilot-prompt-injection-ai-email-phishing)
- [0DIN: Phishing for Gemini](https://0din.ai/blog/phishing-for-gemini)
- [Varonis: Direct Send abuse](https://www.varonis.com/blog/direct-send-exploit)
- [Abnormal: Direct Send abuse](https://abnormal.ai/blog/m365-direct-send-abuse)
- [Abnormal: DKIM replay of Google notifications](https://abnormal.ai/blog/dkim-replay-google-phishing-attack)
- [Barracuda: split and nested QR codes](https://blog.barracuda.com/2025/08/20/threat-spotlight-split-nested-qr-codes-quishing-attacks)
- [Barracuda: ASCII QR codes and blob URIs](https://it.blog.barracuda.com/2024/10/09/novel-phishing-techniques-ascii-based-qr-codes-blob-uri)
- [BleepingComputer: ClickFix has never been bigger](https://www.bleepingcomputer.com/news/security/clickfix-has-never-been-bigger-and-ai-tools-are-its-most-convincing-lure-yet/)
