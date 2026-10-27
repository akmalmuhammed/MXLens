# How MXLens investigates an email

MXLens does not stop at a score. For every `.eml` it writes the investigation an experienced
SOC analyst would write when a user reports a message, and it shows the evidence for every
statement. It is available as:

- the **Investigation** panel at the top of the web report (with "Copy write-up" and
  *Export → Investigation write-up (Markdown)*);
- `mxlens --investigate message.eml` in the CLI (Markdown; add `--no-defang` for live values);
- the `investigation` field in `mxlens --json` output and in `analyzeEmail()` results.

Everything runs locally. Nothing is looked up online.

## The method

### 1. Open everything first

Before any judgment, MXLens unpacks what the recipient could interact with:

- the visible text (HTML stripped), hidden text and HTML comments;
- **attached emails** (`.eml` / `message/rfc822`), recursively; kits hide the lure in an
  attached email so the delivered message is only a disclaimer;
- **QR codes** in images, inline images and `data:` URIs (ZXing), including inside attached
  emails;
- links in PDFs, HTML/SVG attachments, and archive listings.

Every extracted link (including QR destinations) goes through the same link checks.

### 2. Reconstruct the delivery path

`Received` headers are read oldest first and each hop gets a role:

| Role | Meaning |
|---|---|
| Origin | Where the message started: the attacker's machine, a web server script, or the sender's mail client |
| Sender relay | Servers on the sender's side |
| Entered your mail system | The first hop received by your gateway or mailbox provider; its client IP is the internet-facing sender |
| Gateway / Your mail system | Trend Micro, Proofpoint, Mimecast, IronPort, Barracuda..., then Microsoft 365 or Google |

MXLens records the HELO name versus the real IP (a client calling itself `[127.0.0.1]` from
a public IP is a script), SMTP AUTH (`Authenticated sender:`), missing reverse DNS, and long
holds (a message queued for 43 hours at a gateway, for example). Your own gateway and
provider IPs are never reported as indicators.

### 3. Read authentication at every stage, not just the last

A gateway in front of Microsoft 365 makes Microsoft check SPF against the **gateway's** IP.
The final `spf=pass` can therefore describe your gateway rather than the sender. MXLens
places the first server's results (ARC `i=1` or the gateway's own header) next to the final
ones and says which to believe. It also explains `dmarc=bestguesspass` (no DMARC record),
`compauth` reason codes, unaligned DKIM signers, and why a Return-Path that matches the From
domain proves nothing on its own.

### 4. Answer the seven questions

| Question | How it is answered |
|---|---|
| Is this email malicious? | Verdict, attack type and the strongest evidence |
| Is the sender spoofed? | Edge vs final authentication, DMARC, self-domain spoofing, forged senders inside attached emails, and mail sent through an unrelated (compromised) mailbox. It separates "forged" from "real but abused" |
| Who actually sent it, and from where? | Origin and connecting IPs, HELO/rDNS, authenticated account, X-Originating-IP, DKIM signer, bounce domain |
| Do the authentication results (and a matching Return-Path) prove anything? | Yes only for a DMARC pass not contradicted at the edge |
| What does it want the recipient to do? | Lure theme and brand, plus the action: scan a QR code, sign in, open a file, run a command, enter a device code, call a number, pay |
| Why was it not blocked? | Concrete control gaps with the fix for each: SCL -1 bypass, gateway SPF masking (Enhanced Filtering for Connectors), missing DMARC, QR in an image, lure in an attached email, Direct Send, gateway detected but delivered... |
| Is it targeted at us? | Recipient names in filenames, links and subject; your organization's name; your own domain or lookalikes of it |

Answers use "likely" or "unclear" when the evidence is weaker, for example a file with no
delivery headers, whose From line cannot be verified.

### 5. Turn it into action

- **Indicators with roles:** sender, envelope sender, mailbox used to send it, forged inner
  sender, QR/link destinations, origin and sending IPs, relay host, hashes, Message-IDs.
  Each one is marked *block* or *context*, so a compromised legitimate mailbox is not
  blindly blocklisted.
- **MITRE ATT&CK** techniques with the evidence for each.
- **Response checklist:** *now* (purge, block, ask recipients), *next* (sign-in review,
  token revocation, endpoint checks, abuse reports), and *prevent a repeat* (one fix per gap).
- **Hunting and purge queries**, filled in with the real values:
  - Microsoft Defender XDR / Sentinel: `EmailEvents` (campaign and exact message),
    `EmailUrlInfo`, `UrlClickEvents`, `DeviceNetworkEvents`, and
    `EmailAttachmentInfo`/`DeviceFileEvents`
  - Entra ID `SigninLogs` since delivery (device-code sign-ins for device-code lures)
  - Microsoft Purview `New-ComplianceSearch` / `New-ComplianceSearchAction -Purge`

  When a gateway relays your mail, `SenderIPv4` is left out of the queries because it would
  only match the gateway.

## Limits

- Offline by design: no reputation, WHOIS or sandbox look-ups. The optional enrichment panel
  adds those if you configure keys.
- Device-code, AiTM and CAPTCHA-gated pages are judged by the email, not by visiting the page.
- QR codes inside PDF pages are not decoded yet.
- A file with no `Received` headers cannot show where it came from. Find the delivered copy
  with the hunting queries.
