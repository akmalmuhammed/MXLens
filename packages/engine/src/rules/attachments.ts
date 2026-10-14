import type { AttachmentInfo } from "../types.ts";
import { extensionOf } from "../parse/attachments.ts";
import { ARCHIVE_EXTENSIONS, CONTAINER_EXTENSIONS, EXECUTABLE_EXTENSIONS, EXPECTED_TYPE, HTML_EXTENSIONS, MACRO_EXTENSIONS, ZIP_BASED_EXTENSIONS } from "../data/lists.ts";
import { oleHasMacros } from "../parse/attachments.ts";
import { ATTACK, finding } from "./rule.ts";
import type { Rule } from "./rule.ts";

function mark(a: AttachmentInfo, ruleId: string): void {
    if (!a.flags.includes(ruleId)) a.flags.push(ruleId);
}

const BIDI_CONTROLS = /[‪-‮⁦-⁩‎‏]/;

function isRunnable(ext: string): boolean {
    return EXECUTABLE_EXTENSIONS.has(ext) || CONTAINER_EXTENSIONS.has(ext);
}

export const dangerousAttachment: Rule = {
    meta: {
        id: "ATT-001",
        title: "Attachment can run code or open a web page",
        category: "attachments",
        severity: "critical",
        attack: [ATTACK.attachment, ATTACK.userExecution],
        description:
            "An attachment is an executable or script (.exe, .js, .lnk, ...), a disk image that bypasses Mark-of-the-Web (.iso, .img, .vhd), or an HTML/SVG file that opens a local web page, the most common way to deliver fake login pages.",
        falsePositives: "IT teams sending installers or scripts internally; calendar or report exports saved as .html.",
    },
    run(ctx) {
        const hits: { a: AttachmentInfo; kind: string; sev: "critical" | "high" }[] = [];
        for (const a of ctx.attachments) {
            const ext = extensionOf(a.filename);
            if (EXECUTABLE_EXTENSIONS.has(ext)) hits.push({ a, kind: `executable or script (.${ext})`, sev: "critical" });
            else if (CONTAINER_EXTENSIONS.has(ext) || a.detectedType === "iso") hits.push({ a, kind: `disk image (.${ext || "iso"})`, sev: "critical" });
            else if (HTML_EXTENSIONS.has(ext) || a.detectedType === "html" || a.detectedType === "svg") {
                const raw = ctx.rawAttachments.find((r) => (r.filename ?? "(unnamed)") === a.filename);
                const markup = raw ? new TextDecoder().decode(raw.content.subarray(0, 512 * 1024)) : "";
                const harvests = /<input\b[^>]*type\s*=\s*["']?password/i.test(markup) || /<form\b[^>]*action\s*=\s*["']?https?:/i.test(markup);
                const smuggles = /\b(atob|unescape|fromCharCode|msSaveOrOpenBlob|createObjectURL)\s*\(/i.test(markup) || /window\.location(\.href)?\s*=|location\.replace\s*\(/i.test(markup);
                const svg = ext === "svg" || a.detectedType === "svg";
                const kind = harvests ? "HTML page with a login form" : smuggles ? `${svg ? "SVG" : "HTML"} file that decodes or redirects with script` : svg ? "SVG image that can carry script" : "HTML page";
                hits.push({ a, kind, sev: harvests || smuggles ? "critical" : "high" });
            }
            else {
                const inner = a.archiveEntries.find((n) => isRunnable(extensionOf(n)) || HTML_EXTENSIONS.has(extensionOf(n)));
                if (inner && ARCHIVE_EXTENSIONS.has(ext)) hits.push({ a, kind: `archive containing ${inner}`, sev: "critical" });
            }
        }
        if (hits.length === 0) return null;
        hits.forEach((h) => mark(h.a, this.meta.id));
        const worst = hits.find((h) => h.sev === "critical") ?? hits[0];
        return finding(this.meta, worst.sev, `The attachment ${worst.a.filename} is ${worst.kind.startsWith("archive") ? "an " : "a "}${worst.kind}.`, hits.map((h) => ({ label: "Attachment", value: h.a.filename, note: h.kind })));
    },
};

export const disguisedFilename: Rule = {
    meta: {
        id: "ATT-002",
        title: "Disguised file name",
        category: "attachments",
        severity: "critical",
        attack: [ATTACK.doubleExtension, ATTACK.rtlo, ATTACK.attachment],
        description:
            "A file name hides its real type: a double extension (invoice.pdf.exe), padding before the extension, or invisible right-to-left characters that reverse how the name is displayed.",
        falsePositives: "Archives named like backup.tar.gz are not flagged.",
    },
    run(ctx) {
        const hits: { a: AttachmentInfo; why: string }[] = [];
        for (const a of ctx.attachments) {
            if (BIDI_CONTROLS.test(a.filename)) {
                hits.push({ a, why: "contains invisible text-direction characters" });
                continue;
            }
            const parts = a.filename.toLowerCase().split(".");
            if (parts.length >= 3) {
                const last = parts[parts.length - 1];
                const prev = parts[parts.length - 2].trim();
                if (isRunnable(last) && /^(pdf|docx?|xlsx?|pptx?|txt|jpe?g|png|gif|csv|rtf|html?)$/.test(prev)) {
                    hits.push({ a, why: `looks like .${prev} but is .${last}` });
                    continue;
                }
            }
            if (/\s{5,}\.[a-z0-9]+$/i.test(a.filename) || /_{8,}\.[a-z0-9]+$/i.test(a.filename)) hits.push({ a, why: "pads the name to push the real extension out of view" });
        }
        if (hits.length === 0) return null;
        hits.forEach((h) => mark(h.a, this.meta.id));
        return finding(this.meta, "critical", `The attachment ${JSON.stringify(hits[0].a.filename)} ${hits[0].why}.`, hits.map((h) => ({ label: "Attachment", value: h.a.filename, note: h.why })));
    },
};

export const typeMismatch: Rule = {
    meta: {
        id: "ATT-003",
        title: "File content does not match its name",
        category: "attachments",
        severity: "critical",
        attack: [ATTACK.masquerading, ATTACK.attachment],
        description: "The file's first bytes show a different type than its extension claims, for example an executable named invoice.pdf.",
        falsePositives: "Mislabelled exports (a .csv that is really .xlsx) are reported at medium severity.",
    },
    run(ctx) {
        const hits: { a: AttachmentInfo; sev: "critical" | "high" | "medium"; expected: string }[] = [];
        for (const a of ctx.attachments) {
            const ext = extensionOf(a.filename);
            const expected = EXPECTED_TYPE[ext];
            const actual = a.detectedType;
            if (!actual || !expected || actual === expected) continue;
            if (expected === "text" && actual === "text") continue;
            const executableInside = actual.endsWith("-executable") && !EXECUTABLE_EXTENSIONS.has(ext);
            const htmlInside = (actual === "html" || actual === "svg") && !HTML_EXTENSIONS.has(ext);
            hits.push({ a, expected, sev: executableInside ? "critical" : htmlInside ? "high" : "medium" });
        }
        if (hits.length === 0) return null;
        hits.forEach((h) => mark(h.a, this.meta.id));
        const worst = hits.sort((x, y) => (x.sev === "critical" ? -1 : y.sev === "critical" ? 1 : 0))[0];
        return finding(this.meta, worst.sev, `${worst.a.filename} claims to be ${worst.expected} but its content is ${worst.a.detectedType}.`, hits.map((h) => ({
            label: "Attachment",
            value: h.a.filename,
            note: `content is ${h.a.detectedType}`,
        })));
    },
};

export const macroDocument: Rule = {
    meta: {
        id: "ATT-004",
        title: "Macro-enabled document",
        category: "attachments",
        severity: "high",
        attack: [ATTACK.vba, ATTACK.attachment, ATTACK.userExecution],
        description: "An Office document can contain or does contain VBA macros, which run code when the recipient enables content.",
        falsePositives: "Finance and engineering teams that exchange macro workbooks internally.",
    },
    run(ctx) {
        const hits: { a: AttachmentInfo; why: string }[] = [];
        ctx.attachments.forEach((a, i) => {
            const ext = extensionOf(a.filename);
            if (a.archiveEntries.some((n) => /vbaProject\.bin$/i.test(n))) hits.push({ a, why: "contains a VBA project" });
            else if (MACRO_EXTENSIONS.has(ext)) hits.push({ a, why: `macro-enabled format (.${ext})` });
            else if (a.detectedType === "ole") {
                const raw = ctx.rawAttachments.find((r) => (r.filename ?? "(unnamed)") === a.filename) ?? ctx.rawAttachments[i];
                if (raw && oleHasMacros(raw.content)) hits.push({ a, why: "legacy Office file with a VBA project" });
            }
        });
        if (hits.length === 0) return null;
        hits.forEach((h) => mark(h.a, this.meta.id));
        return finding(this.meta, "high", `${hits[0].a.filename} is a ${hits[0].why === `macro-enabled format (.${extensionOf(hits[0].a.filename)})` ? "macro-enabled Office document" : "document that " + hits[0].why}.`, hits.map((h) => ({ label: "Attachment", value: h.a.filename, note: h.why })));
    },
};

const PASSWORD_HINT = /\b(password|passcode|pwd)\s*(is|:|=)\s*["'“]?(?!(needed|required|not|none|n\/a)\b)[A-Za-z0-9!@#$%^&*]{3,}/i;

export const protectedArchive: Rule = {
    meta: {
        id: "ATT-005",
        title: "Password-protected archive",
        category: "attachments",
        severity: "high",
        attack: [ATTACK.attachment, ATTACK.obfuscation],
        description: "An archive is encrypted, or the message gives a password for an attached archive. Encryption stops e-mail security tools from scanning the contents.",
        falsePositives: "Organizations that encrypt sensitive documents by policy and share the password separately.",
    },
    run(ctx) {
        const archives = ctx.attachments.filter((a) => ARCHIVE_EXTENSIONS.has(extensionOf(a.filename)) || a.detectedType === "zip" && !ZIP_BASED_EXTENSIONS.has(extensionOf(a.filename)) || a.detectedType === "rar" || a.detectedType === "7z");
        const encrypted = archives.filter((a) => a.encryptedArchive);
        const hinted = archives.length > 0 && PASSWORD_HINT.test(ctx.text);
        if (encrypted.length === 0 && !hinted) return null;
        const list = encrypted.length ? encrypted : archives;
        list.forEach((a) => mark(a, this.meta.id));
        return finding(
            this.meta,
            "high",
            encrypted.length ? `${encrypted[0].filename} is encrypted, so its contents cannot be scanned.` : `The message provides a password for the attached archive ${archives[0].filename}.`,
            list.map((a) => ({ label: "Archive", value: a.filename, note: a.encryptedArchive ? "encrypted" : "password given in body" })),
        );
    },
};

export const attachmentRules: Rule[] = [dangerousAttachment, disguisedFilename, typeMismatch, macroDocument, protectedArchive];
