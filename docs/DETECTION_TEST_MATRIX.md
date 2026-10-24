# MXLens Detection Engine - Complete Reference Guide

> **Version:** 3.0  
> **Last Updated:** January 2026  
> **Total Detection Rules:** 85+  
> **All Processing:** 100% Client-Side (Your data never leaves your browser)

---

## 📖 How to Read This Guide

This document explains **every detection rule** in MXLens. For each rule, you'll find:

| Column | Meaning |
|--------|---------|
| **What It Detects** | The specific threat or anomaly being identified |
| **Why It Matters** | Real-world attack context and risk explanation |
| **How to Test** | Step-by-step instructions to trigger the detection |
| **Score Impact** | Points deducted from the 100-point base score |
| **Severity** | 🔴 Critical, 🟡 Medium, ⚪ Low, ✅ Pass/Bonus |

---

## 🎯 Understanding the Scoring System

MXLens starts every email at **100 points** and deducts points for each threat detected.

| Final Score | Verdict | What It Means |
|-------------|---------|---------------|
| **80-100** | 🟢 CLEAN | Email appears legitimate. Low risk. |
| **50-79** | 🟡 SUSPICIOUS | Caution advised. Review before acting. |
| **0-49** | 🔴 MALICIOUS | High probability of phishing or malware. Block/quarantine. |

**Confidence Level** is calculated based on how many detection rules triggered and their severity.

---

# SECTION 1: EMAIL AUTHENTICATION (16 Rules)

These rules analyze the technical headers that prove whether an email actually came from who it claims to be from.

---

## 1.1 DMARC Analysis

**What is DMARC?**  
DMARC (Domain-based Message Authentication, Reporting, and Conformance) is the gold standard for email authentication. It tells receiving servers what to do when SPF or DKIM fails.

### Rule 1.1.1: DMARC Fail
| Aspect | Details |
|--------|---------|
| **What It Detects** | Email failed DMARC validation (authentication failed) |
| **Why It Matters** | This is the strongest signal that an email is spoofed. Legitimate organizations pass DMARC. |
| **How to Test** | Upload an .eml file containing `dmarc=fail` in the `Authentication-Results` header |
| **Score Impact** | **-50 points** |
| **Severity** | 🔴 Critical |
| **Example Header** | `Authentication-Results: mx.google.com; dmarc=fail (p=REJECT)` |

### Rule 1.1.2: DMARC Policy "Quarantine"
| Aspect | Details |
|--------|---------|
| **What It Detects** | Sender's domain uses a weak "quarantine" DMARC policy |
| **Why It Matters** | Organization hasn't fully committed to DMARC enforcement. Emails failing authentication are quarantined, not rejected. |
| **How to Test** | Email with `dmarc=pass` and `p=quarantine` in header |
| **Score Impact** | **-5 points** |
| **Severity** | ⚪ Low |

### Rule 1.1.3: DMARC Policy "None"
| Aspect | Details |
|--------|---------|
| **What It Detects** | Sender's domain uses a monitoring-only DMARC policy |
| **Why It Matters** | Organization is only monitoring DMARC failures, not enforcing. Spoofed emails may still be delivered. |
| **How to Test** | Email with `dmarc=pass` and `p=none` in header |
| **Score Impact** | **-15 points** |
| **Severity** | 🟡 Medium |

### Rule 1.1.4: No DMARC Record
| Aspect | Details |
|--------|---------|
| **What It Detects** | Sender's domain has no DMARC DNS record at all |
| **Why It Matters** | Anyone can send emails claiming to be from this domain. No authentication protection. |
| **How to Test** | Email without any `dmarc=` result in Authentication-Results |
| **Score Impact** | **-15 points** |
| **Severity** | 🟡 Medium |

---

## 1.2 SPF Analysis

**What is SPF?**  
SPF (Sender Policy Framework) is a DNS record that lists which servers are allowed to send email for a domain.

### Rule 1.2.1: SPF Fail
| Aspect | Details |
|--------|---------|
| **What It Detects** | Email was sent from a server not authorized by the domain owner |
| **Why It Matters** | The sending server is explicitly NOT allowed to send for this domain. Strong spoofing indicator. |
| **How to Test** | Upload email with `spf=fail` in Authentication-Results |
| **Score Impact** | **-20 points** |
| **Severity** | 🟡 Medium |
| **Example Header** | `Authentication-Results: spf=fail (sender IP is 45.67.89.123)` |

### Rule 1.2.2: SPF Softfail
| Aspect | Details |
|--------|---------|
| **What It Detects** | Email was sent from a server not explicitly authorized |
| **Why It Matters** | A "soft" failure suggests the domain hasn't fully configured SPF. Could be legitimate forwarding or misconfiguration. |
| **How to Test** | Upload email with `spf=softfail` |
| **Score Impact** | **-10 points** |
| **Severity** | ⚪ Low |

### Rule 1.2.3: SPF Missing/Neutral
| Aspect | Details |
|--------|---------|
| **What It Detects** | No SPF result or SPF returned "neutral" |
| **Why It Matters** | Domain has weak or no SPF protection. Anyone could send from any server. |
| **How to Test** | Email with `spf=none` or `spf=neutral` |
| **Score Impact** | **-10 points** |
| **Severity** | ⚪ Low |

---

## 1.3 DKIM Analysis

**What is DKIM?**  
DKIM (DomainKeys Identified Mail) adds a digital signature to emails that proves the content wasn't modified in transit.

### Rule 1.3.1: DKIM Fail
| Aspect | Details |
|--------|---------|
| **What It Detects** | Email's digital signature is invalid or doesn't match |
| **Why It Matters** | Either the email was modified in transit, or the signature is forged. |
| **How to Test** | Upload email with `dkim=fail` |
| **Score Impact** | **-20 points** |
| **Severity** | 🟡 Medium |

### Rule 1.3.2: DKIM Missing
| Aspect | Details |
|--------|---------|
| **What It Detects** | Email has no DKIM signature at all |
| **Why It Matters** | Most legitimate organizations sign their emails. Absence of DKIM is suspicious for major brands. |
| **How to Test** | Email without DKIM-Signature header |
| **Score Impact** | **-10 points** |
| **Severity** | ⚪ Low |

---

## 1.4 ARC Analysis (Forwarding Protection)

**What is ARC?**  
ARC (Authenticated Received Chain) preserves authentication when emails are forwarded through mailing lists or other services.

### Rule 1.4.1: ARC Chain Broken
| Aspect | Details |
|--------|---------|
| **What It Detects** | Email was forwarded but the ARC chain is invalid |
| **Why It Matters** | ARC should maintain trust through forwarding. A broken chain may indicate tampering. |
| **How to Test** | Upload forwarded email with `arc=fail` |
| **Score Impact** | **-20 points** |
| **Severity** | 🟡 Medium |

### Rule 1.4.2: ARC Override (Bonus!)
| Aspect | Details |
|--------|---------|
| **What It Detects** | Valid ARC chain restores trust despite SPF/DKIM failures |
| **Why It Matters** | Legitimate forwarding (e.g., mailing lists) breaks SPF/DKIM. ARC proves the original was valid. |
| **How to Test** | Forwarded email with broken SPF but valid ARC seal |
| **Score Impact** | **+Refund of SPF/DKIM penalties** |
| **Severity** | ✅ Bonus |

---

## 1.5 Routing Analysis

These rules examine how the email traveled across the internet.

### Rule 1.5.1: Missing Received Headers
| Aspect | Details |
|--------|---------|
| **What It Detects** | Email has no "Received" headers showing its journey |
| **Why It Matters** | Attackers sometimes forge emails with blank routing to hide their origin. Legitimate emails always have received headers. |
| **How to Test** | Craft email with no Received headers |
| **Score Impact** | **-40 points** |
| **Severity** | 🔴 Critical |

### Rule 1.5.2: Suspicious Single Hop
| Aspect | Details |
|--------|---------|
| **What It Detects** | Email only passed through 1 server |
| **Why It Matters** | Most emails pass through 2-5 servers. A single hop could indicate the email was injected directly. |
| **How to Test** | Email with only 1 Received header |
| **Score Impact** | **-10 points** |
| **Severity** | ⚪ Low |

### Rule 1.5.3: Timestamp Anomaly
| Aspect | Details |
|--------|---------|
| **What It Detects** | Received timestamps are out of chronological order |
| **Why It Matters** | Emails should flow forward in time. Reversed timestamps suggest header manipulation. |
| **How to Test** | Email where later hop has earlier timestamp |
| **Score Impact** | **-20 points** |
| **Severity** | 🟡 Medium |

### Rule 1.5.4: Duplicate Authentication Headers
| Aspect | Details |
|--------|---------|
| **What It Detects** | Multiple Authentication-Results headers in same email |
| **Why It Matters** | Attackers sometimes inject fake authentication results to override real ones. |
| **How to Test** | Email with 2+ Authentication-Results headers |
| **Score Impact** | **-20 points** |
| **Severity** | 🟡 Medium |

### Rule 1.5.5: Unrecognized AuthServ-ID
| Aspect | Details |
|--------|---------|
| **What It Detects** | Authentication-Results added by a server that is not a well-known provider |
| **Why It Matters** | The SPF/DKIM/DMARC results cannot be independently verified. Most organizations run their own receiving servers, so this lowers confidence rather than indicating phishing. Provider domains match on a label boundary (`google.com.attacker.example` is not trusted). |
| **How to Test** | Email with Authentication-Results from `mx.example.org` |
| **Score Impact** | **-5 points**, no "Trusted Authentication Source" confidence bonus |
| **Severity** | 🟢 Low |

---

# SECTION 2: EMAIL BODY ANALYSIS (6 Rules)

These rules scan the content of the email for suspicious patterns.

---

### Rule 2.1: Urgency Language
| Aspect | Details |
|--------|---------|
| **What It Detects** | Pressure tactics like "immediately", "urgent", "24 hours", "act now" |
| **Why It Matters** | Phishers create panic to bypass rational thinking. Urgency is a hallmark of social engineering. |
| **How to Test** | Include "Verify your account immediately or it will be suspended" in body |
| **Score Impact** | **-10 points** |
| **Severity** | ⚪ Low |
| **Example Phrases** | "urgent", "immediately", "within 24 hours", "verify now", "act fast" |

### Rule 2.2: Credential Harvesting Keywords
| Aspect | Details |
|--------|---------|
| **What It Detects** | Language specifically targeting passwords and logins |
| **Why It Matters** | These keywords strongly correlate with credential phishing. Legitimate services rarely ask you to "update your password" via email link. |
| **How to Test** | Include "Please update your login password to secure your account" |
| **Score Impact** | **-30 points** |
| **Severity** | 🔴 Critical |
| **Example Phrases** | "password", "login", "verify account", "update security", "confirm identity" |

### Rule 2.3: HTML Form in Email Body
| Aspect | Details |
|--------|---------|
| **What It Detects** | `<form>` tags or `<input type="password">` embedded in email |
| **Why It Matters** | Legitimate companies NEVER ask you to enter passwords directly in an email. This is always malicious. |
| **How to Test** | Send HTML email with `<form action="..."><input type="password">`
| **Score Impact** | **-40 points** |
| **Severity** | 🔴 Critical |

### Rule 2.4: Raw IP Address Link
| Aspect | Details |
|--------|---------|
| **What It Detects** | Links like `http://192.168.1.1/login` instead of domain names |
| **Why It Matters** | Legitimate services use domains. Raw IPs hide the real destination and are often temporary attack infrastructure. |
| **How to Test** | Include link `http://45.67.89.123/verify` in body |
| **Score Impact** | **-40 points** |
| **Severity** | 🟡 Medium |

### Rule 2.5: Hidden Text (CSS Evasion)
| Aspect | Details |
|--------|---------|
| **What It Detects** | Text hidden via CSS (`font-size: 0`, `display: none`, `visibility: hidden`) |
| **Why It Matters** | Attackers hide keywords from spam filters while showing different content to users. |
| **How to Test** | HTML email with `<span style="font-size:0">verify password immediately</span>` |
| **Score Impact** | **-30 points** |
| **Severity** | 🟡 Warning |

### Rule 2.6: Homoglyph Characters in Body
| Aspect | Details |
|--------|---------|
| **What It Detects** | Lookalike characters (e.g., Cyrillic "а" looks like Latin "a") |
| **Why It Matters** | "pаypal.com" (with Cyrillic а) looks identical to "paypal.com" but goes to attacker site. |
| **How to Test** | Replace one letter with its Cyrillic equivalent |
| **Score Impact** | **-60 points** |
| **Severity** | 🔴 Critical |

---

# SECTION 3: ATTACHMENT ANALYSIS (15 Rules)

These rules inspect attached files for malware, masquerading, and dangerous content.

---

## 3.1 File Type Masquerading

### Rule 3.1.1: Masquerading File (Type Mismatch)
| Aspect | Details |
|--------|---------|
| **What It Detects** | File extension doesn't match actual file type (e.g., `.pdf` that's really an `.exe`) |
| **Why It Matters** | Classic malware trick. User thinks they're opening a PDF, but it's an executable. |
| **How to Test** | Attach file named `invoice.pdf` but with EXE magic bytes (starts with `MZ`) |
| **Score Impact** | **-100 points** |
| **Severity** | 🔴 Critical |

### Rule 3.1.2: Double Extension
| Aspect | Details |
|--------|---------|
| **What It Detects** | Filenames like `invoice.pdf.exe` or `document.doc.js` |
| **Why It Matters** | Windows hides known extensions, so `invoice.pdf.exe` shows as `invoice.pdf` |
| **How to Test** | Attach file named `report.pdf.exe` |
| **Score Impact** | **-70 points** |
| **Severity** | 🔴 Critical |

---

## 3.2 Script & Executable Detection

### Rule 3.2.1: Executable Attachment
| Aspect | Details |
|--------|---------|
| **What It Detects** | Files with extensions: `.exe`, `.scr`, `.bat`, `.cmd`, `.com`, `.pif` |
| **Why It Matters** | These files run code when opened. Legitimate emails rarely contain executables. |
| **How to Test** | Attach any `.exe` file |
| **Score Impact** | **-60 points** |
| **Severity** | 🔴 Critical |

### Rule 3.2.2: Script Attachment
| Aspect | Details |
|--------|---------|
| **What It Detects** | Script files: `.js`, `.vbs`, `.ps1`, `.jar`, `.py`, `.sh`, `.html` |
| **Why It Matters** | Scripts can execute malicious code. HTML files can contain phishing forms. |
| **How to Test** | Attach any `.js` or `.vbs` file |
| **Score Impact** | **-60 points** |
| **Severity** | 🔴 Critical |

### Rule 3.2.3: Malicious Script Content
| Aspect | Details |
|--------|---------|
| **What It Detects** | Dangerous functions inside scripts: `eval()`, `WScript.Shell`, `powershell.exe` |
| **Why It Matters** | These functions are used to execute arbitrary code, download malware, or access system resources. |
| **How to Test** | Attach `.js` file containing `eval(atob("..."))` |
| **Score Impact** | **-90 points** |
| **Severity** | 🔴 Critical |
| **Functions Detected** | `eval()`, `WScript.Shell`, `Shell.Application`, `cmd.exe`, `powershell`, `base64_decode`, `AutoOpen` |

---

## 3.3 Macro Detection

### Rule 3.3.1: Hidden Macro in "Safe" File
| Aspect | Details |
|--------|---------|
| **What It Detects** | `.docx`, `.xlsx` files containing hidden VBA macro project |
| **Why It Matters** | These extensions should NOT contain macros. Presence indicates tampering. |
| **How to Test** | Upload `.docx` file with `vbaProject.bin` inside ZIP structure |
| **Score Impact** | **-90 points** |
| **Severity** | 🔴 Critical |

### Rule 3.3.2: Active Macros (Macro-Enabled)
| Aspect | Details |
|--------|---------|
| **What It Detects** | `.docm`, `.xlsm` files that legitimately contain macros |
| **Why It Matters** | Macro-enabled files are risky but sometimes legitimate. Lower penalty than hidden macros. |
| **How to Test** | Attach `.docm` file with working macros |
| **Score Impact** | **-50 points** |
| **Severity** | 🟡 Warning |

### Rule 3.3.3: Macro-Enabled Extension (No Macros Found)
| Aspect | Details |
|--------|---------|
| **What It Detects** | `.docm/.xlsm` extension but no macros detected |
| **Why It Matters** | Suspicious—why use macro extension if no macros? Mild warning. |
| **How to Test** | Attach `.docm` without actual macros inside |
| **Score Impact** | **-30 points** |
| **Severity** | 🟡 Medium |

---

## 3.4 Archive & Disk Image Detection

### Rule 3.4.1: Password-Protected Archive
| Aspect | Details |
|--------|---------|
| **What It Detects** | Encrypted ZIP files that cannot be scanned |
| **Why It Matters** | Attackers password-protect archives to evade scanning. Password often in email body. |
| **How to Test** | Attach password-protected .zip file |
| **Score Impact** | **-70 points** |
| **Severity** | 🟡 Warning |

### Rule 3.4.2: Nested Dangerous Files
| Aspect | Details |
|--------|---------|
| **What It Detects** | Archives containing executable or script files |
| **Why It Matters** | Hiding malware inside ZIPs is common evasion technique. |
| **How to Test** | Attach .zip containing `malware.exe` |
| **Score Impact** | **-85 points** |
| **Severity** | 🔴 Critical |

### Rule 3.4.3: Disk Image Attachment
| Aspect | Details |
|--------|---------|
| **What It Detects** | `.iso`, `.img` disk image files |
| **Why It Matters** | ISO files auto-mount on Windows 10+, bypassing many security controls. |
| **How to Test** | Attach any `.iso` file |
| **Score Impact** | **-80 points** |
| **Severity** | 🔴 Critical |

---

## 3.5 Shortcut (LNK) Detection

### Rule 3.5.1: Shortcut Attachment
| Aspect | Details |
|--------|---------|
| **What It Detects** | `.lnk` Windows shortcut files |
| **Why It Matters** | LNK files can execute commands when clicked. Common malware delivery method. |
| **How to Test** | Attach any `.lnk` file |
| **Score Impact** | **-75 points** |
| **Severity** | 🔴 Critical |

### Rule 3.5.2: Malicious LNK Target
| Aspect | Details |
|--------|---------|
| **What It Detects** | LNK file pointing to `powershell.exe`, `cmd.exe`, or suspicious paths |
| **Why It Matters** | LNK files can hide malicious commands in their "target" property. |
| **How to Test** | Create LNK with target `powershell.exe -enc [base64]` |
| **Score Impact** | **-95 points** |
| **Severity** | 🔴 Critical |

---

## 3.6 Context-Aware Bonuses & Penalties

### Rule 3.6.1: Urgency + Dangerous Attachment Combo
| Aspect | Details |
|--------|---------|
| **What It Detects** | Dangerous attachment combined with urgency language in body |
| **Why It Matters** | Combined signals are stronger indicators. Attackers use pressure to rush victims. |
| **Score Impact** | **Additional -20 points** |
| **Severity** | ⚪ Amplifier |

### Rule 3.6.2: Strong Auth Mitigates Macro Risk (Bonus)
| Aspect | Details |
|--------|---------|
| **What It Detects** | Macro file from sender with DMARC `p=reject` |
| **Why It Matters** | If sender has strong authentication, macro may be legitimate (e.g., internal business tool). |
| **Score Impact** | **+15 points refund** |
| **Severity** | ✅ Bonus |

---

# SECTION 4: IMPERSONATION DETECTION (4 Rules)

These rules detect when attackers pretend to be trusted brands or executives.

---

### Rule 4.1: Brand Display Name Spoofing
| Aspect | Details |
|--------|---------|
| **What It Detects** | Display name claims to be a brand, but email address is unrelated |
| **Why It Matters** | `"Microsoft Support" <hacker@gmail.com>` looks legitimate in many email clients. |
| **How to Test** | Send from `random@hotmail.com` with display name "PayPal Security" |
| **Score Impact** | **-80 points** |
| **Severity** | 🔴 Critical |
| **Brands Detected** | Microsoft, PayPal, Amazon, Apple, Google, Netflix, Bank of America, Wells Fargo, Chase, DHL, FedEx, UPS, IRS, WHO, CDC, and 50+ more |

### Rule 4.2: Executive Role Spoofing
| Aspect | Details |
|--------|---------|
| **What It Detects** | Display name claims executive title (CEO, CFO, Director) from free email provider |
| **Why It Matters** | Classic BEC attack: "CEO" emailing from gmail.com to request wire transfer. |
| **How to Test** | Send from `random@gmail.com` with display name "CEO John Smith" |
| **Score Impact** | **-80 points** |
| **Severity** | 🔴 Critical |
| **Titles Detected** | CEO, CFO, CTO, COO, President, Director, VP, Managing Director, Chairman |

### Rule 4.3: Authorized Brand Email (Pass)
| Aspect | Details |
|--------|---------|
| **What It Detects** | Brand name in display matches legitimate brand domain |
| **Why It Matters** | `"Microsoft" <noreply@microsoft.com>` is legitimate. No penalty. |
| **Score Impact** | **No penalty** |
| **Severity** | ✅ Pass |

### Rule 4.4: Internal Role from Corporate Domain (Pass)
| Aspect | Details |
|--------|---------|
| **What It Detects** | Role title (HR, IT, Finance) from non-free-mail domain |
| **Why It Matters** | `"HR Department" <hr@company.com>` is likely legitimate internal email. |
| **Score Impact** | **No penalty** |
| **Severity** | ✅ Pass |

---

# SECTION 5: BEC (Business Email Compromise) DETECTION (5 Rules)

These rules combine multiple signals to detect sophisticated business fraud attacks.

---

### Rule 5.1: High-Risk BEC Pattern
| Aspect | Details |
|--------|---------|
| **What It Detects** | Combination of: Executive title + Free provider Reply-To + Urgency language |
| **Why It Matters** | This triple combination is the classic BEC attack pattern. Attacker poses as CEO requesting urgent wire transfer. |
| **How to Test** | From: "CEO" + Reply-To: @gmail.com + Body: "urgent wire transfer" |
| **Score Impact** | **-40 points** |
| **Severity** | 🔴 Critical |

### Rule 5.2: Free Reply-To + Urgency
| Aspect | Details |
|--------|---------|
| **What It Detects** | Reply-To uses free provider (gmail, hotmail, yahoo) combined with urgency |
| **Why It Matters** | Legitimate business rarely uses free email for important correspondence. |
| **How to Test** | Corporate From address but Reply-To to @hotmail.com + urgency keywords |
| **Score Impact** | **-20 points** |
| **Severity** | 🟡 Medium |

### Rule 5.3: Free Provider Reply-To
| Aspect | Details |
|--------|---------|
| **What It Detects** | Reply-To differs from From and uses free email provider |
| **Why It Matters** | Mild signal. Sometimes legitimate (forwarding), sometimes evasion. |
| **How to Test** | From: @company.com, Reply-To: @gmail.com |
| **Score Impact** | **-10 points** |
| **Severity** | ⚪ Low |

### Rule 5.4: Brand Impersonation in Body
| Aspect | Details |
|--------|---------|
| **What It Detects** | Email body mentions brand (e.g., "PayPal") but sender is not that brand + credential harvesting keywords |
| **Why It Matters** | "Your PayPal account needs verification" from @gmail.com is classic phishing. |
| **How to Test** | Body: "Verify your PayPal account" from non-paypal.com address |
| **Score Impact** | **-50 points** |
| **Severity** | 🔴 Critical |

### Rule 5.5: Brand Mismatch (No Credential Keywords)
| Aspect | Details |
|--------|---------|
| **What It Detects** | Body mentions brand X but From domain is brand Y (no phishing keywords) |
| **Why It Matters** | Could be newsletter about a brand, or could be fishing. Lower severity without credential keywords. |
| **Score Impact** | **-20 points** |
| **Severity** | 🟡 Medium |

---

# SECTION 6: THREAD HIJACKING DETECTION (3 Rules)

Attackers often send emails that look like replies to trick recipients.

---

### Rule 6.1: Fake Reply Detection
| Aspect | Details |
|--------|---------|
| **What It Detects** | Subject starts with "Re:" or "Fwd:" but email has no `In-Reply-To` or `References` headers |
| **Why It Matters** | Attackers fake replies to create false sense of prior relationship. Real replies have threading headers. |
| **How to Test** | Subject: "Re: Invoice Payment" with no In-Reply-To header |
| **Score Impact** | **-75 points** |
| **Severity** | 🔴 Critical |

### Rule 6.2: Valid Reply Thread (Pass)
| Aspect | Details |
|--------|---------|
| **What It Detects** | "Re:" subject with proper In-Reply-To and References headers |
| **Why It Matters** | Legitimate reply in an existing thread. No penalty. |
| **Score Impact** | **No penalty** |
| **Severity** | ✅ Pass |

### Rule 6.3: German/International Reply Format
| Aspect | Details |
|--------|---------|
| **What It Detects** | Foreign reply formats: "AW:" (German), "SV:" (Swedish), "RE:" variations without threading |
| **Why It Matters** | Attackers use international formats to evade detection while faking replies. |
| **How to Test** | Subject: "AW: Rechnung" without In-Reply-To |
| **Score Impact** | **-75 points** |
| **Severity** | 🔴 Critical |

---

# SECTION 7: LINK OBFUSCATION DETECTION (4 Rules)

These rules detect attempts to hide malicious URLs.

---

### Rule 7.1: URL Shortener
| Aspect | Details |
|--------|---------|
| **What It Detects** | Links using bit.ly, tinyurl, t.co, goo.gl, ow.ly, and other shorteners |
| **Why It Matters** | Shorteners hide the real destination. Often used to obscure phishing links. |
| **How to Test** | Include `https://bit.ly/xyz123` in email body |
| **Score Impact** | **-10 points** |
| **Severity** | ⚪ Low |
| **Services Detected** | bit.ly, tinyurl.com, t.co, goo.gl, ow.ly, is.gd, buff.ly, rebrand.ly, and 20+ more |

### Rule 7.2: Subdomain Deception
| Aspect | Details |
|--------|---------|
| **What It Detects** | URLs where trusted brand appears as subdomain of untrusted root |
| **Why It Matters** | `https://paypal.com.secure-login.net` looks like PayPal but goes to `secure-login.net` |
| **How to Test** | Include `https://microsoft.com.evil-site.net/login` |
| **Score Impact** | **-25 points** |
| **Severity** | 🟡 Medium |

### Rule 7.3: Raw IP URL
| Aspect | Details |
|--------|---------|
| **What It Detects** | Links using IP addresses instead of domain names |
| **Why It Matters** | Legitimate services use domains. Raw IPs are often temporary attack infrastructure. |
| **How to Test** | Include `http://45.67.89.123/download` |
| **Score Impact** | **-15 points** |
| **Severity** | 🟡 Medium |
| **Exception** | Localhost IPs (127.0.0.1, 192.168.x.x) are excluded |

### Rule 7.4: Localhost IP (Pass)
| Aspect | Details |
|--------|---------|
| **What It Detects** | Links to localhost or private network IPs |
| **Why It Matters** | These are internal/development links, not attacks. |
| **Score Impact** | **No penalty** |
| **Severity** | ✅ Pass |

---

# SECTION 8: CREDENTIAL FORM DETECTION (3 Rules)

Legitimate services NEVER embed login forms in emails.

---

### Rule 8.1: Embedded Login Form
| Aspect | Details |
|--------|---------|
| **What It Detects** | HTML `<form>` tag in email body |
| **Why It Matters** | Forms harvest credentials locally. Attackers don't even need you to visit a website. |
| **How to Test** | Include `<form action="https://evil.com/steal" method="post">` |
| **Score Impact** | **-30 points** |
| **Severity** | 🔴 Critical |

### Rule 8.2: Password Input Field
| Aspect | Details |
|--------|---------|
| **What It Detects** | `<input type="password">` in email HTML |
| **Why It Matters** | Password fields in email = 100% phishing. No legitimate use case. |
| **How to Test** | Include `<input type="password" name="pwd">` |
| **Score Impact** | **-30 points** |
| **Severity** | 🔴 Critical |

### Rule 8.3: Form Action to External URL
| Aspect | Details |
|--------|---------|
| **What It Detects** | Form `action` attribute pointing to external domain |
| **Why It Matters** | Credentials are sent directly to attacker server when form is submitted. |
| **How to Test** | `<form action="http://phishing-site.com/collect">` |
| **Score Impact** | **-30 points** |
| **Severity** | 🔴 Critical |

---

# SECTION 9: QUISHING (QR PHISHING) DETECTION (3 Rules)

Attackers embed QR codes in emails to bypass text-based filters.

---

### Rule 9.1: QR Code in Inline Image
| Aspect | Details |
|--------|---------|
| **What It Detects** | Base64-encoded images in email body containing QR codes with URLs |
| **Why It Matters** | Users scan QR codes without thinking. URL bypasses all link detection. |
| **How to Test** | Embed base64 PNG of QR code containing malicious URL |
| **Score Impact** | **-25 points** |
| **Severity** | 🟡 Medium |

### Rule 9.2: QR Code in Attachment
| Aspect | Details |
|--------|---------|
| **What It Detects** | Attached PNG/JPG/PDF containing QR code with URL |
| **Why It Matters** | QR codes in attachments are scanned and URL is added to link analysis. |
| **How to Test** | Attach image file containing QR code |
| **Score Impact** | **-25 points** |
| **Severity** | 🟡 Medium |

### Rule 9.3: Clean QR Code (Pass)
| Aspect | Details |
|--------|---------|
| **What It Detects** | QR code with non-URL content (contact info, WiFi config, etc.) |
| **Why It Matters** | Not all QR codes are malicious. Only URL payloads are flagged. |
| **Score Impact** | **No penalty** |
| **Severity** | ✅ Pass |

---

# SECTION 10: HOMOGRAPH ATTACK DETECTION (5 Rules)

These rules detect Unicode tricks used to create lookalike domains and text.

---

### Rule 10.1: Homograph in From Domain
| Aspect | Details |
|--------|---------|
| **What It Detects** | From domain contains lookalike characters (e.g., Cyrillic "а" instead of Latin "a") |
| **Why It Matters** | `pаypal.com` (Cyrillic а) looks identical to `paypal.com` (Latin a) in most fonts. |
| **How to Test** | Send from domain with Cyrillic character substitution |
| **Score Impact** | **-90 points** |
| **Severity** | 🔴 Critical |

### Rule 10.2: Homograph in Return-Path
| Aspect | Details |
|--------|---------|
| **What It Detects** | Return-Path domain uses mixed Latin + Cyrillic scripts |
| **Why It Matters** | Return-Path is often hidden from users but affects delivery. Less visible attack. |
| **Score Impact** | **-50 points** |
| **Severity** | 🟡 Medium |

### Rule 10.3: Punycode Detection
| Aspect | Details |
|--------|---------|
| **What It Detects** | Text containing "xn--" Punycode prefix (encoded Unicode domain) |
| **Why It Matters** | Punycode is the encoded form of Unicode domains. `xn--pypal-4ve.com` = `pаypal.com` |
| **Score Impact** | **Flag only** |
| **Severity** | 🟡 Warning |

### Rule 10.4: Zero-Width Characters
| Aspect | Details |
|--------|---------|
| **What It Detects** | Invisible characters: Zero-Width Space (U+200B), Zero-Width Joiner (U+200D), BOM (U+FEFF) |
| **Why It Matters** | These invisible characters can hide in text to evade filters while appearing normal to users. |
| **How to Test** | Insert U+200B between characters in domain or keywords |
| **Score Impact** | **Flag only** |
| **Severity** | 🟡 Warning |

### Rule 10.5: Mixed Script Attack
| Aspect | Details |
|--------|---------|
| **What It Detects** | Text mixing Latin and Cyrillic (or other scripts) in same word |
| **Why It Matters** | Strongest homograph signal. "Micr٥soft" mixes Latin and Arabic numerals to deceive. |
| **How to Test** | Create word with both Latin and Cyrillic characters |
| **Score Impact** | **Flag** |
| **Severity** | 🔴 Critical |

---

# SECTION 11: MAGIC BYTE DETECTION (12 Signatures)

MXLens reads the first bytes of files to determine their TRUE type, regardless of extension.

| Signature (Hex) | Detected Type | Common Extensions | Attack Use Case |
|-----------------|---------------|-------------------|-----------------|
| `4D5A` (MZ) | Windows Executable | .exe, .dll, .scr | Malware, backdoors |
| `25504446` (%PDF) | PDF Document | .pdf | Malicious PDFs with JavaScript |
| `504B0304` (PK..) | ZIP Archive | .zip, .docx, .xlsx | Nested malware, Office with macros |
| `CAFEBABE` | Java Class | .class, .jar | Cross-platform malware |
| `7F454C46` | Linux ELF | None (executable) | Linux malware |
| `89504E47` | PNG Image | .png | Clean, but QR code container |
| `FFD8FF` | JPEG Image | .jpg, .jpeg | Clean, but QR code container |
| `47494638` | GIF Image | .gif | Clean |
| `526172211A0700` | RAR Archive | .rar | Nested malware |
| `377ABCAF271C` | 7-Zip Archive | .7z | Nested malware |
| `4344303031` (CD001) | ISO Disk Image | .iso, .img | Security bypass on Windows |
| `4C00000001140200` | Windows Shortcut | .lnk | Command execution |

---

# SECTION 12: DANGEROUS FUNCTION SCANNING (8 Patterns)

These patterns detect malicious code inside script files and macros.

| Pattern | File Types | What It Does | Attack Example |
|---------|------------|--------------|----------------|
| `eval()` | .js, .html | Executes arbitrary code | `eval(atob("malicious_base64"))` |
| `WScript.Shell` | .vbs, .js | Creates Windows shell | Downloads and runs malware |
| `Shell.Application` | .vbs | COM object shell access | Bypasses security controls |
| `cmd.exe` / `powershell` | .bat, .cmd, .ps1 | Command line execution | Any system command |
| `base64_decode` | .php | Deobfuscation | Hidden malware payload |
| `FromBase64String` | .ps1 | PowerShell base64 decode | Obfuscated commands |
| `XMLHttpRequest` / `fetch` | .js, .html | Network requests | Data exfiltration, C2 callback |
| `AutoOpen` / `Document_Open` | VBA macros | Auto-execute on open | Immediate malware execution |

---

# SECTION 13: THREAT INTELLIGENCE (6 Integrations)

MXLens can check external threat databases for additional context.

| Service | What It Checks | Data Returned | Privacy Note |
|---------|---------------|---------------|--------------|
| **VirusTotal** | File hashes | Detection count, vendor names | Hash only, not file content |
| **Google Safe Browsing** | URLs | Threat type (phishing, malware) | URL only |
| **AbuseIPDB** | IP addresses | Abuse confidence score, report count | IP only |
| **Abuse.ch URLhaus** | URLs | Threat classification, malware family | URL only |
| **WHOIS** | Domains | Registration date, registrar, age | Domain only |
| **IP Geolocation** | IP addresses | Country, ISP, ASN | IP only |

> **Privacy Note:** These integrations only send hashes, URLs, or IPs—never the actual email content.

---

# SECTION 14: END-TO-END TEST SCENARIOS

Use these complete test cases to verify the detection engine.

| Test Name | Setup | Expected Verdict | Score Range |
|-----------|-------|------------------|-------------|
| **Clean Corporate** | Valid SPF/DKIM/DMARC, body: "Meeting at 3pm" | 🟢 CLEAN | 90-100 |
| **Phishing Basic** | SPF fail, body: "Verify your password immediately" | 🟡 SUSPICIOUS | 40-60 |
| **Malware Dropper** | DMARC fail, attachment: invoice.pdf (EXE inside), body: "Please review" | 🔴 MALICIOUS | 0-20 |
| **BEC Attack** | CEO display name, gmail Reply-To, body: "Urgent wire transfer" | 🟡 SUSPICIOUS | 30-50 |
| **Quishing Attack** | SPF pass, attached QR code image with URL, body: "Scan to verify" | 🟡 SUSPICIOUS | 50-70 |
| **Fake Reply** | Subject: "Re: Invoice", no In-Reply-To header | 🟡 SUSPICIOUS | 25-40 |
| **ISO Malware** | Unknown AuthServ-ID, attachment: malware.iso, body: "Download required update" | 🔴 MALICIOUS | 0-15 |

---

# APPENDIX: GLOSSARY

| Term | Definition |
|------|------------|
| **DMARC** | Domain-based Message Authentication, Reporting & Conformance |
| **SPF** | Sender Policy Framework - DNS record listing authorized sending servers |
| **DKIM** | DomainKeys Identified Mail - Digital signature proving email authenticity |
| **ARC** | Authenticated Received Chain - Preserves auth through forwarding |
| **BEC** | Business Email Compromise - Fraud targeting wire transfers |
| **Homoglyph** | Characters that look identical but are different Unicode codepoints |
| **Quishing** | QR code phishing - using QR codes to hide malicious URLs |
| **Magic Bytes** | First bytes of a file that identify its true type |
| **LNK** | Windows shortcut file that can execute commands |
| **Punycode** | ASCII encoding of Unicode domain names (starts with xn--) |

---

> **Document Version:** 3.0  
> **Last Updated:** January 19, 2026  
> **Total Rules Documented:** 85+  
> **Maintained by:** MXLens Security Team
