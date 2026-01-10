# MXLens Detection Engine - Test Matrix

> **Last Updated:** 2026-01-02  
> **Total Detection Rules:** 50+  
> **Test Coverage Target:** 100%

---

## 📋 How to Use This Document

Each detection rule includes:
- **Detection Name**: What the rule detects
- **Test Scenario**: How to trigger each detection
- **Expected Outcome**: What should happen when triggered
- **Severity**: Impact on risk score

---

## 1️⃣ HEADER ANALYSIS

| # | Detection | Test Scenario | Expected Outcome | Penalty | Severity |
|---|-----------|---------------|------------------|---------|----------|
| 1.1 | DMARC Fail | Upload email with `dmarc=fail` in Authentication-Results header | Score reduced by 50, "DMARC Fail" penalty shown with critical flag | -50 | 🔴 Critical |
| 1.2 | DMARC Policy Quarantine | Email with `dmarc=pass` and `p=quarantine` in header | Score reduced by 5, warning about weak policy | -5 | ⚪ Low |
| 1.3 | DMARC Policy None | Email with `dmarc=pass` and `p=none` in header | Score reduced by 15, warning about monitoring-only policy | -15 | 🟡 Medium |
| 1.4 | No DMARC Record | Email without dmarc result in Authentication-Results | Score reduced by 15, "No DMARC Record Found" shown | -15 | 🟡 Medium |
| 1.5 | SPF Fail | Email with `spf=fail` in Authentication-Results | Score reduced by 20, "SPF Fail" penalty shown | -20 | 🟡 Medium |
| 1.6 | SPF Softfail | Email with `spf=softfail` in Authentication-Results | Score reduced by 10, "SPF Softfail" penalty shown | -10 | ⚪ Low |
| 1.7 | SPF Missing/Neutral | Email with `spf=none` or `spf=neutral` | Score reduced by 10, appropriate message shown | -10 | ⚪ Low |
| 1.8 | DKIM Fail | Email with `dkim=fail` in Authentication-Results | Score reduced by 20, "DKIM Fail" penalty shown | -20 | 🟡 Medium |
| 1.9 | DKIM Missing | Email without DKIM signature | Score reduced by 10, "DKIM Signature Missing" shown | -10 | ⚪ Low |
| 1.10 | ARC Chain Broken | Email with `arc=fail` in headers | Score reduced by 20, "ARC Chain Broken" penalty | -20 | 🟡 Medium |
| 1.11 | ARC Override | Forwarded email with valid ARC restoring broken SPF/DKIM | Score penalty refunded, "ARC Override" message with original results shown | +refund | ✅ Bonus |
| 1.12 | Missing Received Headers | Email with no Received headers | Score reduced by 40, "Missing Received Headers" critical flag | -40 | 🔴 Critical |
| 1.13 | Suspicious Single Hop | Email with only 1 Received header | Score reduced by 10, "Suspicious Routing (Only 1 Hop)" shown | -10 | ⚪ Low |
| 1.14 | Timestamp Anomaly | Email with out-of-order timestamps in Received headers | Score reduced by 20, "Timestamp Anomaly" shown | -20 | 🟡 Medium |
| 1.15 | Duplicate Auth Headers | Email with multiple Authentication-Results headers | Score reduced by 20, "Duplicate Authentication-Results" shown | -20 | 🟡 Medium |
| 1.16 | Untrusted AuthServ-ID | Email from unknown/untrusted auth server | Score reduced by 60, critical flag with AuthServ-ID displayed | -60 | 🔴 Critical |

---

## 2️⃣ BODY ANALYSIS

| # | Detection | Test Scenario | Expected Outcome | Penalty | Severity |
|---|-----------|---------------|------------------|---------|----------|
| 2.1 | Urgency Language | Email body containing "immediately", "urgent", "24 hours", "verify now" | Score reduced by 10, "Urgency Language Detected" flag | -10 | ⚪ Low |
| 2.2 | Credential Harvesting Keywords | Email containing "password", "login", "verify account", "update security" | Score reduced by 30, "Credential Harvesting Keywords" critical flag | -30 | 🔴 Critical |
| 2.3 | HTML Form in Body | Email with `<form>` tag or `<input type="password">` | Score reduced by 40, "HTML Form in Body" critical flag | -40 | 🔴 Critical |
| 2.4 | Raw IP Address Link | Email with link like `http://192.168.1.1/login` | Score reduced by 40, "Raw IP Address Link" shown | -40 | 🟡 Medium |
| 2.5 | Hidden Text CSS Evasion | Email with `font-size: 0px` or `display: none` + urgency keywords | Score reduced by 30, "Hidden Text / CSS Evasion" warning | -30 | 🟡 Warning |
| 2.6 | Homoglyph Characters | Email with Cyrillic "а" instead of Latin "a" in domain/text | Score reduced by 60, "Homoglyph/Confusable Characters" critical | -60 | 🔴 Critical |

---

## 3️⃣ ATTACHMENT ANALYSIS

| # | Detection | Test Scenario | Expected Outcome | Penalty | Severity |
|---|-----------|---------------|------------------|---------|----------|
| 3.1 | Masquerading File | Attach file `invoice.pdf` with EXE magic bytes (MZ header) | Score reduced by 100, "Masquerading File Detected" critical, shows actual type | -100 | 🔴 Critical |
| 3.2 | Malicious Script Content | Attach .js file containing `eval()` or `WScript.Shell` | Score reduced by 90, "Malicious Script Content" critical, lists functions | -90 | 🔴 Critical |
| 3.3 | Hidden Macro in Safe File | Attach .docx file containing `vbaProject.bin` | Score reduced by 90, "Hidden Macro Detected" critical | -90 | 🔴 Critical |
| 3.4 | Active Macros (Macro-Enabled) | Attach .docm/.xlsm file with macros | Score reduced by 50, "Active Macros Detected" warning | -50 | 🟡 Warning |
| 3.5 | Disk Image Attachment | Attach .iso or .img file | Score reduced by 80, "Disk Image Attachment" critical with bypass warning | -80 | 🔴 Critical |
| 3.6 | Malicious LNK Shortcut | Attach .lnk file pointing to powershell.exe | Score reduced by 95, "Malicious Shortcut" critical, shows target command | -95 | 🔴 Critical |
| 3.7 | Shortcut Attachment | Attach any .lnk file | Score reduced by 75, "Shortcut Attachment" critical | -75 | 🔴 Critical |
| 3.8 | Password-Protected Archive | Attach encrypted .zip file (bit 0 set in header) | Score reduced by 70, "Password-Protected Archive" warning, unscannable note | -70 | 🟡 Warning |
| 3.9 | Nested Dangerous Files | Attach .zip containing malware.exe inside | Score reduced by 85, "Dangerous Files in Archive" critical, lists files | -85 | 🔴 Critical |
| 3.10 | Double Extension | Attach file named `invoice.pdf.exe` | Score reduced by 70, "Double Extension" critical | -70 | 🔴 Critical |
| 3.11 | Executable Attachment | Attach .exe, .scr, .bat, .cmd, .com, or .pif file | Score reduced by 60, "Executable Attachment" critical | -60 | 🔴 Critical |
| 3.12 | Script Attachment | Attach .js, .vbs, .ps1, .jar, .py, .sh, .html file | Score reduced by 60, "Script Attachment" critical | -60 | 🔴 Critical |
| 3.13 | Macro-Enabled Extension | Attach .docm/.xlsm without detected macros | Score reduced by 30, "Macro-Enabled Extension" warning | -30 | 🟡 Medium |
| 3.14 | Urgency + Dangerous Combo | Dangerous attachment + urgency language in body | Additional -20 penalty, "Urgency + Dangerous Attachment" amplifier | -20 | ⚪ Amplifier |
| 3.15 | Strong Auth Mitigation | Macro-enabled file from sender with DMARC p=reject | +15 refund, "Strong Auth Mitigated Macro Risk" message | +15 | ✅ Bonus |

---

## 4️⃣ IMPERSONATION DETECTION

| # | Detection | Test Scenario | Expected Outcome | Penalty | Severity |
|---|-----------|---------------|------------------|---------|----------|
| 4.1 | Brand Display Name Spoofing | Email From: `"Microsoft Support" <hacker@gmail.com>` | Score reduced by 80, "Display Name Spoofing" critical, shows mismatch | -80 | 🔴 Critical |
| 4.2 | Executive Role Spoofing | Email From: `"CEO" <random@hotmail.com>` | Score reduced by 80, spoofing alert for exec impersonation | -80 | 🔴 Critical |
| 4.3 | Authorized Brand Email | Email From: `"Microsoft" <noreply@microsoft.com>` | No penalty, brand verified as legitimate sender | 0 | ✅ Pass |
| 4.4 | Internal Role from Corp Domain | Email From: `"HR Department" <hr@company.com>` (not free email) | No penalty, internal role from corporate domain allowed | 0 | ✅ Pass |

---

## 5️⃣ CROSS-CONTEXT ANALYSIS (BEC Detection)

| # | Detection | Test Scenario | Expected Outcome | Penalty | Severity |
|---|-----------|---------------|------------------|---------|----------|
| 5.1 | High-Risk BEC Pattern | From: "CEO" + Reply-To: gmail.com + urgency language | Score reduced by 40, "High Risk BEC Pattern" critical flag | -40 | 🔴 Critical |
| 5.2 | Free Reply-To + Urgency | Different Reply-To domain (free provider) + urgency keywords | Score reduced by 20, "Suspicious Reply-To" warning | -20 | 🟡 Medium |
| 5.3 | Free Provider Reply-To | Reply-To differs from From and uses gmail/hotmail/yahoo | Score reduced by 10, "Reply-To uses Free Provider" flag | -10 | ⚪ Low |
| 5.4 | Brand Impersonation | Body mentions "PayPal" but sender is not paypal.com + credential keywords | Score reduced by 50, "Brand Impersonation" critical | -50 | 🔴 Critical |
| 5.5 | Brand Mismatch | Body mentions brand X but From domain is brand Y (no credential keywords) | Score reduced by 20, "Brand Mismatch" warning | -20 | 🟡 Medium |

---

## 6️⃣ THREAD HIJACKING

| # | Detection | Test Scenario | Expected Outcome | Penalty | Severity |
|---|-----------|---------------|------------------|---------|----------|
| 6.1 | Fake Reply Detection | Subject starts with "Re:" or "Fwd:" but no In-Reply-To or References headers | Score reduced by 75, "Fake Reply Detected" critical and warning flags | -75 | 🔴 Critical |
| 6.2 | Valid Reply Thread | Subject: "Re: Meeting" with proper In-Reply-To header | No penalty, valid thread continuation | 0 | ✅ Pass |
| 6.3 | German Reply Format | Subject: "AW: Rechnung" without threading headers | Score reduced by 75, detects German reply format spoofing | -75 | 🔴 Critical |

---

## 7️⃣ LINK OBFUSCATION DETECTION

| # | Detection | Test Scenario | Expected Outcome | Penalty | Severity |
|---|-----------|---------------|------------------|---------|----------|
| 7.1 | URL Shortener | Link: `https://bit.ly/xyz123` | Score reduced by 10, "Obfuscated Link (Shortener)" with service named | -10 | ⚪ Low |
| 7.2 | Subdomain Deception | Link: `https://paypal.com.secure-update.net/login` | Score reduced by 25, "Subdomain Deception" shows brand vs actual root | -25 | 🟡 Medium |
| 7.3 | Raw IP URL | Link: `http://45.67.89.123/download` (non-local IP) | Score reduced by 15, "Raw IP URL" detection | -15 | 🟡 Medium |
| 7.4 | Localhost IP (Allowed) | Link: `http://127.0.0.1/test` or `http://localhost/` | No penalty, local IPs excluded from detection | 0 | ✅ Pass |

---

## 8️⃣ CREDENTIAL FORM DETECTION

| # | Detection | Test Scenario | Expected Outcome | Penalty | Severity |
|---|-----------|---------------|------------------|---------|----------|
| 8.1 | Embedded Login Form | HTML email with `<form action="...">` tag | Score reduced by 30, "Embedded Login Form" critical | -30 | 🔴 Critical |
| 8.2 | Password Input Field | HTML email with `<input type="password">` | Score reduced by 30, "Embedded Login Form" critical | -30 | 🔴 Critical |
| 8.3 | Form Action Attribute | HTML with `action="http://evil.com/steal"` attribute | Score reduced by 30, credential form detection triggered | -30 | 🔴 Critical |

---

## 9️⃣ QUISHING (QR PHISHING) DETECTION

| # | Detection | Test Scenario | Expected Outcome | Penalty | Severity |
|---|-----------|---------------|------------------|---------|----------|
| 9.1 | QR Code in Inline Image | Email with base64-encoded QR code image containing malicious URL | Score reduced by 25, "Quishing Detected" with extracted payload shown | -25 | 🟡 Medium |
| 9.2 | QR Code in Attachment | Attached PNG/JPG containing QR code with URL | Score reduced by 25, URL extracted and added to link analysis | -25 | 🟡 Medium |
| 9.3 | Clean QR Code | QR code with legitimate content (e.g., contact info, no URL) | No penalty, only URL payloads are flagged | 0 | ✅ Pass |

---

## 🔟 HOMOGRAPH ATTACK DETECTION

| # | Detection | Test Scenario | Expected Outcome | Penalty | Severity |
|---|-----------|---------------|------------------|---------|----------|
| 10.1 | Homograph in From Domain | From domain contains Cyrillic "а" (U+0430) instead of Latin "a" | Score reduced by 90, "Homograph Attack in From Domain" critical | -90 | 🔴 Critical |
| 10.2 | Homograph in Return-Path | Return-Path domain uses mixed Latin+Cyrillic scripts | Score reduced by 50, "Homograph Attack in Return-Path" | -50 | 🟡 Medium |
| 10.3 | Punycode in Display | Display text contains "xn--" punycode prefix | Detection flagged, "Punycode detected in display text" | Flag | 🟡 Warning |
| 10.4 | Zero-Width Characters | Text contains invisible chars (U+200B, U+200D, U+FEFF) | Detection flagged, "Invisible/Zero-width characters detected" | Flag | 🟡 Warning |
| 10.5 | Mixed Script Attack | Domain/text mixes Latin "a" with Cyrillic "а" in same string | Detection flagged, "Mixed Script (Latin + Cyrillic) Detected" | Flag | 🔴 Critical |

---

## 📁 MAGIC BYTE / FILE TYPE DETECTION

| # | Magic Signature | Detected Type | Test File | Expected Outcome |
|---|-----------------|---------------|-----------|------------------|
| M.1 | `4D5A` (MZ) | EXE/DLL | Windows executable | Identified as executable |
| M.2 | `25504446` (%PDF) | PDF | PDF document | Identified as PDF |
| M.3 | `504B0304` (PK..) | ZIP/Office | ZIP archive or .docx/.xlsx | Identified as ZIP-based |
| M.4 | `CAFEBABE` | Java Class | Compiled Java class | Identified as Java |
| M.5 | `7F454C46` | ELF | Linux executable | Identified as ELF binary |
| M.6 | `89504E47` | PNG | PNG image | Identified as PNG |
| M.7 | `FFD8FF` | JPEG | JPEG image | Identified as JPEG |
| M.8 | `47494638` | GIF | GIF image | Identified as GIF |
| M.9 | `526172211A0700` | RAR | RAR archive | Identified as RAR |
| M.10 | `377ABCAF271C` | 7z | 7-Zip archive | Identified as 7z |
| M.11 | `4344303031` (CD001) | ISO | Disk image | Identified as ISO 9660 |
| M.12 | `4C00000001140200` | LNK | Windows shortcut | Identified as LNK file |

---

## 🔐 DANGEROUS FUNCTION SCANNING

| # | Pattern | File Types | Test Content | Expected Outcome |
|---|---------|------------|--------------|------------------|
| D.1 | `eval()` | .js, .html | JavaScript with `eval(atob("..."))` | "eval" flagged in dangerous functions |
| D.2 | `WScript.Shell` | .vbs, .js | VBScript with shell execution | "shell_execution" flagged |
| D.3 | `Shell.Application` | .vbs | COM object shell access | "shell_execution" flagged |
| D.4 | `cmd.exe` / `powershell` | .bat, .ps1 | Script invoking command shell | "shell_execution" flagged |
| D.5 | `base64_decode` | .php | PHP base64 obfuscation | "encoding_obfuscation" flagged |
| D.6 | `FromBase64String` | .ps1 | PowerShell base64 decode | "encoding_obfuscation" flagged |
| D.7 | `XMLHttpRequest` / `fetch` | .js, .html | Network request code | "network_request" flagged |
| D.8 | `AutoOpen` / `Document_Open` | .vbs (in Office) | Auto-executing macro | "auto_open" flagged |

---

## 🌐 THREAT INTELLIGENCE INTEGRATIONS

| # | Service | Test Scenario | Expected Outcome |
|---|---------|---------------|------------------|
| TI.1 | VirusTotal | Submit known malware hash | Returns detection count and vendor names |
| TI.2 | Google Safe Browsing | Check known phishing URL | Returns "unsafe" with threat type |
| TI.3 | AbuseIPDB | Lookup IP with abuse history | Returns confidence score and report count |
| TI.4 | Abuse.ch | Check URL against URLhaus | Returns threat classification if blacklisted |
| TI.5 | WHOIS | Check newly registered domain | Returns domain age, registrar, creation date |
| TI.6 | Geolocation | Lookup sender IP | Returns country, ISP, ASN info |

---

## ✅ PASS/BONUS SCENARIOS

| # | Scenario | Description | Expected Outcome |
|---|----------|-------------|------------------|
| P.1 | Clean Email | Valid SPF/DKIM/DMARC, no threats | Score 85-100, verdict: CLEAN |
| P.2 | Forwarded with ARC | Broken SPF/DKIM but valid ARC chain | Penalties restored, ARC override shown |
| P.3 | Strong Auth + Macro | Macro file from DMARC p=reject sender | +15 mitigation applied |
| P.4 | Legitimate Brand | Microsoft email from @microsoft.com | No impersonation penalty |
| P.5 | Valid Reply Thread | Re: subject with proper In-Reply-To | No thread hijacking penalty |

---

## 🧪 END-TO-END TEST CASES

| # | Test Name | Attachments | Body Content | Headers | Expected Verdict | Expected Score Range |
|---|-----------|-------------|--------------|---------|------------------|---------------------|
| E2E.1 | Clean Corporate | None | "Meeting at 3pm" | SPF/DKIM/DMARC pass | CLEAN | 90-100 |
| E2E.2 | Phishing Basic | None | "Verify your password immediately" | SPF fail | SUSPICIOUS | 40-60 |
| E2E.3 | Malware Dropper | invoice.pdf (EXE inside) | "Please review attached invoice" | DMARC fail | MALICIOUS | 0-20 |
| E2E.4 | BEC Attack | None | "Urgent wire transfer" | CEO display name, gmail Reply-To | SUSPICIOUS | 30-50 |
| E2E.5 | Quishing Attack | QR code image | "Scan to verify" | SPF pass | SUSPICIOUS | 50-70 |
| E2E.6 | Fake Reply | None | "As discussed" | Subject "Re:" but no In-Reply-To | SUSPICIOUS | 25-40 |
| E2E.7 | ISO Malware | malware.iso | "Download required update" | Unknown AuthServ-ID | MALICIOUS | 0-15 |

---

## 📝 Notes

1. **Score Calculation**: Final score = 100 - (sum of all penalties) + (sum of all bonuses), clamped to 0-100
2. **Verdict Mapping**:
   - 80-100: CLEAN (green)
   - 50-79: SUSPICIOUS (yellow)
   - 0-49: MALICIOUS (red)
3. **Confidence**: Based on number and severity of signals detected
4. **Client-Side Only**: QR scanning and PDF link extraction require browser environment
