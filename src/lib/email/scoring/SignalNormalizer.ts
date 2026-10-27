import { AnalysisResult } from "../HeaderParser";
import { NormalizedSignals, AttachmentSignal, ParsedEmailAttachment, ParsedEmailBody } from "./types";
import { UrlAnalyzer } from "../analysis/UrlAnalyzer";
import { getFirstHeaderValue, getHeaderValue, getHeaderValues } from "../parser/HeaderUtils";
import { AuthenticationAnalyzer } from "../parser/Authentication";
import { decodeHtmlEntities, htmlToVisibleText } from "../analysis/HtmlText";

export class SignalNormalizer {
    static async normalize(
        headerResult: AnalysisResult,
        emailBody: ParsedEmailBody | null,
        options: {
            checkBody: boolean;
            checkAttachments: boolean;
        }
    ): Promise<NormalizedSignals> {

        // 1. Normalize Auth Signals
        const spf = this.mapAuthStatus(headerResult.auth.spf.status);
        const dkim = this.mapAuthStatus(headerResult.auth.dkim.status);
        const dmarc = this.mapAuthStatus(headerResult.auth.dmarc.status);
        const arc = headerResult.arc ? this.mapAuthStatus(headerResult.arc.status) : "none";

        // Extract DMARC Policy
        let dmarcPolicy: NormalizedSignals['dmarcPolicy'] = "unknown";
        const authResults = getHeaderValues(headerResult.headers, "Authentication-Results").join(";").toLowerCase();
        const dmarcDetails = `${authResults};${headerResult.auth.dmarc.details}`.toLowerCase();
        if (/\b(?:p|action)\s*=\s*(?:reject|oreject)\b/.test(dmarcDetails)) dmarcPolicy = "reject";
        else if (/\b(?:p|action)\s*=\s*quarantine\b/.test(dmarcDetails)) dmarcPolicy = "quarantine";
        else if (/\bp\s*=\s*none\b/.test(dmarcDetails)) dmarcPolicy = "none";

        // 2. Normalize Routing
        let timestampsValid = true;
        for (let i = 0; i < headerResult.hops.length - 1; i++) {
            const current = headerResult.hops[i].timestamp;
            const next = headerResult.hops[i + 1].timestamp;
            if (next < current - 2000) {
                timestampsValid = false;
                break;
            }
        }

        // 3. Body Signals (if enabled)
        let bodySignals: Partial<NormalizedSignals> = {
            hasUrgency: false,
            hasCredentialHarvesting: false,
            hasHtmlForm: false,
            suspiciousLinks: false,
            rawIpLinks: false,
            extractedUrls: [],
            urlAnalysis: [], // Initialize empty
            homoglyphDetected: false,
            brandInBody: null,
            hasHiddenText: false
        };

        if (options.checkBody && emailBody) {
            const text = (emailBody.text || "") + (emailBody.html || "");
            bodySignals = this.extractBodyFeatures(
                text,
                emailBody.html || "",
                emailBody.text || "",
                getFirstHeaderValue(headerResult.headers, 'Subject')
            );
        }

        // 4. Attachment Signals
        const attachments: AttachmentSignal[] = [];
        if (options.checkAttachments && emailBody && emailBody.attachments) {
            for (const att of emailBody.attachments) {
                const rawFilename = att.filename || 'unknown';
                const ext = rawFilename.split('.').pop()?.toLowerCase() || "";
                const filename = rawFilename.toLowerCase();
                const content = this.toUint8Array(att.content);

                // Advanced Analysis (Hash & Magic Bytes)
                const sha256 = await this.calculateHash(content);
                const magicType = this.detectMagicType(content);

                // Check for double extension
                const parts = filename.split('.');
                const hasDoubleExtension = parts.length > 2 &&
                    ['exe', 'scr', 'bat', 'com', 'pif', 'js', 'vbs'].includes(parts[parts.length - 1]) &&
                    ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'jpg', 'png'].includes(parts[parts.length - 2]);

                // Check for Masquerading (Mismatch between Magic Bytes and Extension)
                // e.g. Magic=EXE but Extension=PDF
                let isMasquerading = false;
                if (magicType && magicType !== 'unknown') {
                    // Simple masquerade check
                    if (magicType === 'exe' && !['exe', 'dll', 'scr', 'com'].includes(ext)) isMasquerading = true;
                    if (magicType === 'pdf' && ext !== 'pdf') isMasquerading = true;
                    if (magicType === 'zip' && !['zip', 'docx', 'docm', 'xlsx', 'xlsm', 'pptx', 'pptm', 'jar', 'apk'].includes(ext)) isMasquerading = true;
                    // Images usually safe to mismatch (e.g. jpg vs jpeg), skip stricness there for now
                }

                // Phase 2: Macro & Script Detection
                const macroDetected = this.detectMacros(content, magicType || 'unknown', ext);
                const dangerousFunctions = this.scanForDangerousFunctions(content, ext);

                // Phase 3: PDF Link Extraction
                if ((magicType === 'pdf' || (ext === 'pdf' && magicType !== 'exe')) && content) {
                    try {
                        const { extractLinksFromPdf } = await import('@/utils/pdf.client');
                        const pdfLinks = await extractLinksFromPdf(this.toArrayBuffer(content));
                        if (pdfLinks && pdfLinks.length > 0) {
                            if (!bodySignals.extractedUrls) bodySignals.extractedUrls = [];
                            bodySignals.extractedUrls.push(...pdfLinks);
                            bodySignals.extractedUrls = [...new Set(bodySignals.extractedUrls)]; // Unique
                            bodySignals.suspiciousLinks = bodySignals.suspiciousLinks || pdfLinks.some(u => u.startsWith('http'));
                        }
                    } catch (e) {
                        console.warn("PDF link extraction failed", e);
                    }
                }

                attachments.push({
                    filename: rawFilename,
                    extension: ext,
                    size: att.size || content?.length || 0,
                    sha256,
                    magicType,
                    isMasquerading,
                    hasDoubleExtension,
                    isExecutable: ['exe', 'scr', 'bat', 'cmd', 'com', 'pif'].includes(ext) || magicType === 'exe',
                    isMacroEnabled: ['docm', 'xlsm', 'pptm'].includes(ext),
                    macroDetected,
                    isScript: ['js', 'vbs', 'ps1', 'jar', 'py', 'sh', 'html', 'htm'].includes(ext),
                    dangerousFunctions,
                    // Phase 4: Enhanced Detection
                    isArchive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'cab'].includes(ext) || magicType === 'zip',
                    isPasswordProtected: this.isPasswordProtectedArchive(content, magicType || 'unknown'),
                    isDiskImage: ['iso', 'img', 'vhd', 'vhdx', 'dmg'].includes(ext) || magicType === 'iso',
                    isShortcut: ['lnk', 'url', 'webloc', 'desktop'].includes(ext),
                    lnkTarget: ext === 'lnk' ? this.extractLnkTarget(content) : undefined,
                    nestedFiles: this.detectNestedFiles(content, magicType || 'unknown', ext)
                });
            }
        }

        // 5. Cross-Context Prep
        const fromArray = getFirstHeaderValue(headerResult.headers, 'From');
        // Safe parser for "Name <email>" format - ReDoS mitigated
        // Regex Explanation:
        // 1. Optional Name: "([^"<]+)"? -> Greedily captures name, bound by quotes or <
        // 2. Email: <(.+@.+)> -> Captures email inside brackets
        // 3. Fallback to just extracting the email if no brackets
        let fromDisplayName = "";
        let fromEmail = fromArray.trim();

        if (fromArray.includes('<')) {
            const parts = fromArray.split('<');
            if (parts.length >= 2) {
                fromDisplayName = parts[0].replace(/"/g, '').trim();
                const emailPart = parts[1].split('>')[0];
                if (emailPart) fromEmail = emailPart.trim();
            }
        } else {
            fromEmail = fromArray.trim();
        }

        // Fallback: If no @ symbol found, try to find *any* email-like string pattern in the From header
        if (!fromEmail.includes('@') && fromArray.length > 3) {
            const fallbackMatch = fromArray.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
            if (fallbackMatch) {
                fromEmail = fallbackMatch[1];
            }
        }

        const fromDomain = fromEmail.split('@')[1] || "";

        // Reply-To
        const replyTo = getHeaderValue(headerResult.headers, 'Reply-To');
        let replyToDomain = null;
        if (replyTo) {
            const rt = Array.isArray(replyTo) ? replyTo[0] : replyTo;
            const rtMatch = rt.match(/@([^>]+)/);
            if (rtMatch) replyToDomain = rtMatch[1].trim();
        }

        // Threading Signals
        const subject = getFirstHeaderValue(headerResult.headers, 'Subject');

        const inReplyTo = getFirstHeaderValue(headerResult.headers, 'In-Reply-To') || null;

        const references = getFirstHeaderValue(headerResult.headers, 'References') || null;
        const authResultHeaders = getHeaderValues(headerResult.headers, 'Authentication-Results');
        const returnPath = getFirstHeaderValue(headerResult.headers, 'Return-Path');

        return {
            // Threading
            subject,
            inReplyTo,
            references,
            // Auth
            spfResult: spf,
            dkimResult: dkim,
            dmarcResult: dmarc,
            dmarcPolicy,
            arcResult: arc,
            arcOriginalSpf: this.findArcDetail(headerResult.arc?.details, "Origin SPF") || null,
            arcOriginalDkim: this.findArcDetail(headerResult.arc?.details, "Origin DKIM") || null,

            authenticationResultsPresent: authResultHeaders.length > 0,
            multipleAuthHeaders: authResultHeaders.length > 1,
            authservId: this.extractAuthServId(authResultHeaders),
            dmarcBestGuess: headerResult.auth.dmarc.bestGuess === true,
            originAuthMasked: headerResult.originAuth?.masked === true,
            originAuthSummary: headerResult.originAuth?.masked ? this.describeOrigin(headerResult.originAuth) : null,
            exchangeFilteringBypassed: headerResult.exchange?.filteringBypassed === true,

            // Routing
            receivedHopCount: headerResult.hops.length,
            hasReceivedHeaders: headerResult.hops.length > 0,
            headerInjectionDetected: false,
            receivedTimestampsValid: timestampsValid,

            // Sender
            fromDomain: fromDomain.toLowerCase(),
            fromDisplayName,
            replyToDomain: replyToDomain ? replyToDomain.toLowerCase() : null,
            returnPathDomain: returnPath.replace(/[<>]/g, '').split('@')[1] || "",

            // Body
            // Body
            bodyAnalysisEnabled: options.checkBody,
            visibleText: bodySignals.visibleText || "",
            hasUrgency: bodySignals.hasUrgency || false,
            hasCredentialHarvesting: bodySignals.hasCredentialHarvesting || false,
            hasHiddenText: bodySignals.hasHiddenText || false,
            hasHtmlForm: bodySignals.hasHtmlForm || false,
            suspiciousLinks: bodySignals.suspiciousLinks || false,
            rawIpLinks: bodySignals.rawIpLinks || false,
            extractedUrls: bodySignals.extractedUrls || [],
            urlAnalysis: bodySignals.urlAnalysis || [],
            homoglyphDetected: bodySignals.homoglyphDetected || false,
            brandInBody: bodySignals.brandInBody || null,

            // Attachments
            attachmentAnalysisEnabled: options.checkAttachments,
            attachments,

            // Cross Context
            brandInFrom: null,
            isFreeEmailProvider: false,
            isHighValueRole: false
        } as NormalizedSignals;
    }

    private static mapAuthStatus(status: string): "pass" | "fail" | "softfail" | "none" | "neutral" | "temperror" | "permerror" {
        const valid = ["pass", "fail", "softfail", "none", "neutral", "temperror", "permerror"];
        return valid.includes(status) ? status as ReturnType<typeof SignalNormalizer.mapAuthStatus> : "none";
    }

    private static extractAuthServId(header: string | string[]): string | null {
        if (!header) return null;
        const h = Array.isArray(header) ? header[0] : header;
        if (!h || typeof h !== "string") return null;
        // The authserv-id may be followed by a version token ("mx.microsoft.com 1"),
        // which is not part of the host name.
        return AuthenticationAnalyzer.parseAuthServId(h) ?? null;
    }

    private static describeOrigin(origin: NonNullable<AnalysisResult['originAuth']>): string {
        const parts: string[] = [];
        if (origin.spf) parts.push(`SPF ${origin.spf}${origin.spfIp ? ` for ${origin.spfIp}` : ""}`);
        if (origin.dmarc) parts.push(`DMARC ${origin.dmarc}${origin.dmarcAction ? ` (${origin.dmarcAction})` : ""}`);
        const final = origin.finalSpfIp ? ` The final result checked SPF against ${origin.finalSpfIp} instead.` : "";
        return `${origin.source} recorded ${parts.join(", ")}.${final}`;
    }

    private static findArcDetail(details: string[] | undefined, label: string): string | null {
        const detail = details?.find(d => d.toLowerCase().startsWith(`${label.toLowerCase()}:`));
        return detail?.split(": ")[1] || null;
    }

    private static extractBodyFeatures(text: string, html: string, plainText = "", subject = "") {
        // Read what the recipient sees, not markup. HTML-only mail has an empty text part,
        // and raw HTML (style names, attributes) otherwise pollutes keyword matching.
        const visible = `${plainText} ${htmlToVisibleText(html)}`.trim();
        const t = `${subject} ${visible}`.toLowerCase();

        // NLP Regex
        const urgency = /\b(?:immediately|urgent(?:ly)?|24 hours|within \d{1,3} ?(?:hrs?|hours?|days?)|suspend(?:ed)?|unauthori[sz]ed|terminat(?:e|ed)|lock(?:ed)?|verify|blocked|deactivat(?:e|ed)|action required|final notice|failure to|fail to)\b/i;
        const credential = /\b(?:password|credentials?|login|log in|sign in|sign-in|verify (?:your )?account|update (?:your )?(?:security|account|payment|billing)|confirm (?:your )?(?:account|identity|e-?mail|password|mailbox)|re-?validate|account (?:verification|confirmation)|mailbox (?:is )?(?:full|quota|storage))\b/i;

        // HTML Forms
        // ReDoS Mitigation: Avoid catastrophic backtracking on open-ended tags
        // Limit the search scope for attributes to reasonable lengths
        const hasForm =
            /<form[\s>]/i.test(html) ||
            /<input(?:\s+[^>]{0,1000})?\s+type=["']?password["']?/i.test(html) ||
            /action\s*=\s*["'][^"']{0,1000}["']/i.test(html);

        // Links
        // Links - Bounded Repeat to prevent ReDoS on massive strings
        const urlRegex = /https?:\/\/[^\s<>"']{1,2000}/g;
        // Decode entities first so "&amp;" in href attributes does not split query strings.
        // Gmail's data-saferedirecturl attribute is a rewrite artifact the recipient never
        // follows; the real destination is the href, so drop it to avoid phantom redirects.
        const withoutRewrites = text.replace(/\bdata-saferedirecturl\s*=\s*(?:"[^"]{0,4000}"|'[^']{0,4000}')/gi, " ");
        const urls = (decodeHtmlEntities(withoutRewrites).match(urlRegex) || []);
        // Basic IP check: http://1.2.3.4
        const ipLink = urls.some(u => /https?:\/\/(?:\d{1,3}\.){3}\d{1,3}(?:\/|$)/.test(u));

        // Hidden Text / Evasion Detection
        // Only flag if hidden elements contain suspicious patterns (avoid FP on responsive design)
        // 1. Look for font-size: 0 or 1px (almost always malicious)
        // 2. Only flag display:none/visibility:hidden if combined with urgency or credential keywords
        const hasZeroFont = /font-size:\s*(?:0|1)px/i.test(html);
        const hasHiddenCSS = /display:\s*none|visibility:\s*hidden|opacity:\s*0(?!\.)/i.test(html);
        const hasWhiteText = /color:\s*(?:#fff|#ffffff|white|rgb\(255,\s*255,\s*255\))/i.test(html);

        // Zero-font is almost always malicious - flag immediately
        // For other hidden patterns, only flag if body also has urgency OR credential keywords
        const invisibleText = hasZeroFont ||
            ((hasHiddenCSS || hasWhiteText) && (urgency.test(t) || credential.test(t)));

        // Advanced URL Analysis
        const urlAnalysis = UrlAnalyzer.analyze(html);
        const hasUrlMismatch = urlAnalysis.some(a => a.isMismatched);
        const hasSubdomainTrick = urlAnalysis.some(a => a.isSubdomainTrick);
        const hasLookalike = urlAnalysis.some(a => a.isLookalike);

        return {
            visibleText: visible,
            hasUrgency: urgency.test(t),
            hasCredentialHarvesting: credential.test(t),
            hasHiddenText: invisibleText,
            hasHtmlForm: hasForm,
            // Suspicious links if: IP link found OR mismatch/subdomain-trick found
            suspiciousLinks: ipLink || hasUrlMismatch || hasSubdomainTrick || hasLookalike,
            rawIpLinks: ipLink,
            extractedUrls: urls,
            urlAnalysis, // NEW: Full details
            homoglyphDetected: false,
            brandInBody: null
        };
    }

    private static async calculateHash(content: Uint8Array | undefined): Promise<string> {
        if (!content) return "";
        try {
            // Safe Crypto Access (Browser vs Node)
            const subtle = globalThis.crypto?.subtle;
            if (!subtle) return "";

            const hashBuffer = await subtle.digest('SHA-256', this.toArrayBuffer(content));
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            console.warn("Hashing failed", e);
            return "";
        }
    }

    private static toUint8Array(content: ParsedEmailAttachment['content']): Uint8Array | undefined {
        if (!content) return undefined;
        if (content instanceof Uint8Array) return content;
        if (content instanceof ArrayBuffer) return new Uint8Array(content);
        if (typeof content === 'string') return new TextEncoder().encode(content);
        return undefined;
    }

    private static toArrayBuffer(content: Uint8Array): ArrayBuffer {
        const copy = new Uint8Array(content.byteLength);
        copy.set(content);
        return copy.buffer;
    }

    private static detectMagicType(content: Uint8Array | undefined): string | null {
        if (!content || content.length < 4) return null;

        // Convert first few bytes to hex for checking
        const head = Array.from(content.slice(0, 8)).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');

        if (head.startsWith("4D5A")) return "exe"; // MZ
        if (head.startsWith("25504446")) return "pdf"; // %PDF
        if (head.startsWith("504B0304")) return "zip"; // PK.. (Zip, Docx, Jar)
        if (head.startsWith("CAFEBABE")) return "class"; // Java
        if (head.startsWith("7F454C46")) return "elf"; // ELF (Linux Executable)
        if (head.startsWith("89504E47")) return "png";
        if (head.startsWith("FFD8FF")) return "jpg";
        if (head.startsWith("47494638")) return "gif";
        // Phase 4: New formats
        if (head.startsWith("526172211A0700")) return "rar"; // Rar!..
        if (head.startsWith("377ABCAF271C")) return "7z"; // 7z
        if (head.startsWith("4344303031")) return "iso"; // CD001 (ISO 9660)
        if (head.startsWith("4C00000001140200")) return "lnk"; // Windows LNK

        // Check for ISO at offset 32769 (after system area)
        if (content.length > 32780) {
            const isoHead = Array.from(content.slice(32769, 32774)).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
            if (isoHead === "4344303031") return "iso";
        }

        return "unknown";
    }

    private static indexOfSequence(content: Uint8Array, sequence: Uint8Array): boolean {
        // Optimization: For very large files, this should be optimized. 
        // For email attachments (usually <10MB), a simple loop is acceptable for MVP.
        if (content.length < sequence.length) return false;

        // Limit scan range to first 10MB to prevent Zip Bomb CPU exhaustion
        const SCAN_LIMIT = 10 * 1024 * 1024;
        const limit = Math.min(content.length - sequence.length, SCAN_LIMIT);

        // Simple search
        for (let i = 0; i <= limit; i++) {
            let found = true;
            for (let j = 0; j < sequence.length; j++) {
                if (content[i + j] !== sequence[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        return false;
    }

    private static detectMacros(content: Uint8Array | undefined, magicType: string, ext: string): boolean {
        if (!content) return false;

        // Check for vbaProject.bin in ZIP (Office) files
        // Hex for 'vbaProject.bin' is 76 62 61 50 72 6F 6A 65 63 74 2E 62 69 6E

        // Check if it's a ZIP-based Office file
        if (magicType === 'zip' || ['docx', 'docm', 'xlsx', 'xlsm', 'pptx', 'pptm'].includes(ext)) {
            const vbaSignature = new Uint8Array([0x76, 0x62, 0x61, 0x50, 0x72, 0x6F, 0x6A, 0x65, 0x63, 0x74, 0x2E, 0x62, 0x69, 0x6E]);
            if (this.indexOfSequence(content, vbaSignature)) return true;
        }

        return false;
    }

    private static scanForDangerousFunctions(content: Uint8Array | undefined, ext: string): string[] {
        if (!content) return [];

        // Only scan text-based scripts or interpreted languages
        const scriptExts = ['js', 'vbs', 'ps1', 'html', 'htm', 'py', 'sh', 'bat', 'cmd'];
        if (!scriptExts.includes(ext)) return [];

        let text = "";
        try {
            // Basic UTF-8 decode. 
            const decoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });
            // Limit to first 100KB for performance
            text = decoder.decode(content.slice(0, 100 * 1024));
        } catch {
            return [];
        }

        const found: string[] = [];
        const patterns = [
            { id: "eval", regex: /\beval\s*\(/i },
            { id: "shell_execution", regex: /(?:WScript\.Shell|Shell\.Application|cmd\.exe|powershell)/i },
            { id: "encoding_obfuscation", regex: /(?:base64_decode|FromBase64String)/i },
            { id: "network_request", regex: /(?:XMLHttpRequest|fetch\(|curl|wget)/i },
            { id: "auto_open", regex: /(?:AutoOpen|Document_Open|Workbook_Open)/i }
        ];

        for (const p of patterns) {
            if (p.regex.test(text)) found.push(p.id);
        }

        return found;
    }

    /**
     * Check if a ZIP archive is password protected
     * ZIP files have a "general purpose bit flag" at byte 6 where bit 0 = encrypted
     */
    private static isPasswordProtectedArchive(content: Uint8Array | undefined, magicType: string): boolean {
        if (!content || content.length < 10) return false;

        // Only check ZIP-based files
        if (magicType !== 'zip') return false;

        // ZIP local file header: bytes 6-7 contain general purpose bit flag
        // Bit 0 (0x01) = file is encrypted
        if (content.length > 7 && (content[6] & 0x01) === 0x01) {
            return true;
        }

        // Also check for "PBES" signature (encrypted ZIP variant)
        const head = Array.from(content.slice(0, 30)).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
        if (head.includes('50424553')) return true; // "PBES"

        return false;
    }

    /**
     * Extract target path from Windows .lnk (shortcut) file
     * LNK files have a specific structure with target path embedded
     */
    private static extractLnkTarget(content: Uint8Array | undefined): string | undefined {
        if (!content || content.length < 76) return undefined;

        // LNK magic: 4C 00 00 00 01 14 02 00
        const lnkMagic = [0x4C, 0x00, 0x00, 0x00];
        if (!lnkMagic.every((b, i) => content[i] === b)) return undefined;

        try {
            // Try to extract readable strings from the file
            const decoder = new TextDecoder('utf-16le', { fatal: false });
            const text = decoder.decode(content.slice(76, Math.min(content.length, 1000)));

            // Look for common malicious patterns
            const suspiciousPatterns = [
                /powershell\.exe/i,
                /cmd\.exe\s+\/c/i,
                /mshta\.exe/i,
                /wscript\.exe/i,
                /cscript\.exe/i,
                /regsvr32\.exe/i,
                /rundll32\.exe/i,
                /http[s]?:\/\//i
            ];

            for (const pattern of suspiciousPatterns) {
                const match = text.match(pattern);
                if (match) return match[0];
            }

            // Extract any executable path
            const exeMatch = text.match(/[A-Z]:\\[^\x00]+\.exe/i);
            if (exeMatch) return exeMatch[0];

        } catch {
            // Ignore parsing errors
        }

        return undefined;
    }

    /**
     * Detect files nested inside archives (ZIP format only for now)
     * Returns list of dangerous file types found inside
     */
    private static detectNestedFiles(content: Uint8Array | undefined, magicType: string, ext: string): string[] | undefined {
        if (!content || content.length < 30) return undefined;
        if (magicType !== 'zip' && !['zip', 'docx', 'xlsx', 'pptx', 'jar', 'apk'].includes(ext)) return undefined;

        const dangerousFiles: string[] = [];
        const dangerousExtensions = ['exe', 'scr', 'bat', 'cmd', 'com', 'pif', 'js', 'vbs', 'ps1', 'lnk', 'iso', 'img'];

        try {
            // Scan for local file headers in ZIP
            // Each local file header starts with PK\x03\x04 followed by file info
            const text = new TextDecoder('utf-8', { fatal: false }).decode(content.slice(0, Math.min(content.length, 50000)));

            // Extract filenames from ZIP structure (simplified)
            const filenamePattern = /[\w\-. ]+\.(exe|scr|bat|cmd|com|pif|js|vbs|ps1|lnk|iso|img|msi|dll)/gi;
            const matches = text.matchAll(filenamePattern);

            for (const match of matches) {
                const filename = match[0];
                const ext = match[1].toLowerCase();
                if (dangerousExtensions.includes(ext) && !dangerousFiles.includes(filename)) {
                    dangerousFiles.push(filename);
                    if (dangerousFiles.length >= 5) break; // Limit results
                }
            }
        } catch {
            // Ignore parsing errors
        }

        return dangerousFiles.length > 0 ? dangerousFiles : undefined;
    }
}
