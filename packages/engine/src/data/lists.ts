/** Free webmail providers: anyone can create an address on these domains. */
export const FREEMAIL_DOMAINS = new Set([
    "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "hotmail.co.uk", "live.com",
    "msn.com", "yahoo.com", "yahoo.co.uk", "ymail.com", "aol.com", "icloud.com", "me.com",
    "mac.com", "proton.me", "protonmail.com", "pm.me", "gmx.com", "gmx.de", "gmx.net",
    "mail.com", "zoho.com", "zohomail.com", "yandex.com", "yandex.ru", "mail.ru", "qq.com",
    "163.com", "126.com", "tutanota.com", "tuta.io", "fastmail.com", "web.de", "inbox.com",
]);

/**
 * URL shorteners. The value is the brand that owns a first-party shortener, so
 * lnkd.in in mail from linkedin.com is not reported.
 */
export const SHORTENERS = new Map<string, string | null>([
    ["bit.ly", null], ["tinyurl.com", null], ["ow.ly", null], ["is.gd", null], ["buff.ly", null],
    ["rebrand.ly", null], ["cutt.ly", null], ["shorturl.at", null], ["rb.gy", null], ["tiny.cc", null],
    ["t.ly", null], ["bl.ink", null], ["s.id", null], ["v.gd", null], ["qrco.de", null], ["tr.im", null],
    ["x.co", null], ["shorte.st", null], ["adf.ly", null], ["clck.ru", null], ["u.to", null],
    ["t.co", "X"], ["lnkd.in", "LinkedIn"], ["youtu.be", "Google"], ["goo.gl", "Google"], ["g.co", "Google"],
    ["amzn.to", "Amazon"], ["aka.ms", "Microsoft"], ["fb.me", "Meta"],
]);

/** Query parameters that commonly carry a redirect destination. */
export const REDIRECT_PARAMS = [
    "url", "u", "q", "redirect", "redirect_uri", "redirect_url", "redirecturl", "next", "target",
    "dest", "destination", "goto", "return", "returnurl", "return_url", "continue", "r", "link", "to",
];

/** Extensions that run code when opened on a typical Windows or macOS desktop. */
export const EXECUTABLE_EXTENSIONS = new Set([
    "exe", "scr", "com", "pif", "bat", "cmd", "js", "jse", "vbs", "vbe", "wsf", "wsh", "hta",
    "ps1", "psm1", "msi", "msix", "msp", "appx", "appxbundle", "jar", "lnk", "cpl", "dll", "reg",
    "chm", "xll", "iqy", "slk", "url", "library-ms", "search-ms", "settingcontent-ms", "inf",
    "app", "command", "pkg", "dmg", "sh", "py", "apk",
]);

/** Disk images and containers used to slip executables past Mark-of-the-Web. */
export const CONTAINER_EXTENSIONS = new Set(["iso", "img", "vhd", "vhdx", "udf"]);

/** Attachments that open as a web page: the classic credential-harvest delivery. */
export const HTML_EXTENSIONS = new Set(["html", "htm", "shtml", "xhtml", "mht", "mhtml", "svg"]);

export const MACRO_EXTENSIONS = new Set([
    "docm", "dotm", "xlsm", "xltm", "xlam", "xlsb", "pptm", "potm", "ppam", "ppsm", "sldm",
]);

export const ARCHIVE_EXTENSIONS = new Set(["zip", "rar", "7z", "gz", "tgz", "tar", "ace", "arj", "cab", "bz2", "xz"]);

/** Extensions whose files are ZIP containers internally. */
export const ZIP_BASED_EXTENSIONS = new Set([
    "zip", "docx", "docm", "dotx", "dotm", "xlsx", "xlsm", "xltx", "xltm", "pptx", "pptm",
    "potx", "ppsx", "ppsm", "jar", "apk", "odt", "ods", "odp", "epub", "xlam", "xlsb",
]);

/** Expected detected type for common extensions, used to spot disguised files. */
export const EXPECTED_TYPE: Record<string, string> = {
    pdf: "pdf",
    zip: "zip", docx: "zip", docm: "zip", xlsx: "zip", xlsm: "zip", pptx: "zip", pptm: "zip",
    doc: "ole", xls: "ole", ppt: "ole", msg: "ole",
    png: "png", jpg: "jpeg", jpeg: "jpeg", gif: "gif",
    rar: "rar", "7z": "7z", rtf: "rtf", exe: "pe-executable", dll: "pe-executable", scr: "pe-executable",
    txt: "text", csv: "text", ics: "text",
};
