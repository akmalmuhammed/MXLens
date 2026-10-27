import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { attachmentText, markupKind } from "../../analysis/AttachmentText";

/**
 * ClickFix / FileFix: a fake CAPTCHA or error page tells the user to press Win+R (or open
 * File Explorer / a terminal), paste a command the page silently copied, and run it. The
 * email or its HTML/SVG attachment carries the instructions and often the command itself.
 */
export class ClickFixDetector implements Detector {
    id = "clickfix";
    name = "ClickFix / Paste-and-Run Lure";
    description = "Detects instructions to paste and run commands (Win+R, terminal, File Explorer) and embedded command lines.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['content'];

    // A ClickFix lure always pairs "open a run box / terminal / Explorer" with "paste".
    // Requiring both (or one plus a fake human check) keeps security newsletters that
    // merely mention "Win+R" from matching.
    private openRun: RegExp[] = [
        /\b(?:press|hold|use)\s+(?:the\s+)?(?:windows|win|⊞)\s*(?:key\s*)?\+?\s*(?:and\s+)?["']?r\b/i,
        /\b(?:win|windows)\s*\+\s*r\b/i,
        /\b(?:open|launch)\s+(?:the\s+)?(?:run\s+dialog|terminal|powershell|command\s+prompt|file\s+explorer)\b/i,
        /\b(?:cmd|command)\s*\+\s*space\b[\s\S]{0,80}\bterminal\b/i
    ];
    private paste: RegExp[] = [
        /\b(?:ctrl|control|cmd|command)\s*\+\s*v\b/i,
        /\bpaste\b[\s\S]{0,80}\b(?:run\s+(?:box|dialog|window)|terminal|powershell|command\s+prompt|cmd|file\s+explorer|address\s+bar|verification\s+code)\b/i,
        /\bright-?click\b[\s\S]{0,40}\bpaste\b/i
    ];

    private commands: RegExp[] = [
        /\bpowershell(?:\.exe)?\b[^\n]{0,200}?\s-(?:e|en|enc|encodedcommand|w|windowstyle|nop|noprofile|ep|executionpolicy|c|command)\b/i,
        /\bmshta(?:\.exe)?\s+["']?(?:https?:|vbscript:|javascript:)/i,
        /\b(?:iex|invoke-expression)\s*[(\s]/i,
        /\b(?:irm|iwr|invoke-webrequest|invoke-restmethod|curl|wget)\b[^\n]{0,200}\|\s*(?:iex|invoke-expression|sh|bash|zsh)\b/i,
        /\bmsiexec(?:\.exe)?\s+\/[iq]\S*\s+["']?https?:/i,
        /\b(?:rundll32|regsvr32)(?:\.exe)?\s+[^\n]{0,80}(?:https?:|\\\\|javascript:|scrobj)/i,
        /\bconhost(?:\.exe)?\s+--headless\b/i,
        /\bcmd(?:\.exe)?\s+\/[ck]\s+[^\n]{0,120}(?:curl|powershell|bitsadmin|certutil|start\s+\/min)/i,
        /navigator\.clipboard\.writeText\s*\(|document\.execCommand\s*\(\s*["']copy["']/i
    ];

    private captcha = /\b(?:verify\s+(?:that\s+)?you\s+are\s+(?:a\s+)?human|i'?m\s+not\s+a\s+robot|human\s+verification|verification\s+steps?)\b/i;

    detect(context: DetectionContext): DetectionResult | null {
        const sources: { where: string; text: string }[] = [];
        const body = `${context.signals.visibleText || ""} ${context.emailBody?.text || ""}`;
        sources.push({ where: "message body", text: body });
        for (const att of context.attachments || []) {
            const text = attachmentText(att);
            if (markupKind(att, text)) sources.push({ where: `attachment ${att.filename || "unnamed"}`, text });
        }

        let best: { where: string; instructions: boolean; command: boolean; captcha: boolean } | null = null;
        for (const s of sources) {
            const opens = this.openRun.some(re => re.test(s.text));
            const pastes = this.paste.some(re => re.test(s.text));
            const captcha = this.captcha.test(s.text);
            const instructions = (opens && pastes) || ((opens || pastes) && captcha);
            const command = this.commands.some(re => re.test(s.text));
            if (!instructions && !command) continue;
            const rank = (instructions ? 2 : 0) + (command ? 2 : 0) + (captcha ? 1 : 0);
            const bestRank = best ? (best.instructions ? 2 : 0) + (best.command ? 2 : 0) + (best.captcha ? 1 : 0) : -1;
            if (rank > bestRank) best = { where: s.where, instructions, command, captcha };
        }
        if (!best) return null;

        if (best.instructions && best.command) {
            return {
                triggered: true,
                score: 0.95,
                penalty: -50,
                name: this.name,
                reason: `${best.where} tells the reader to paste and run a command and contains a command line to run${best.captcha ? ", behind a fake human-verification step" : ""} (ClickFix/FileFix).`,
                metadata: best
            };
        }
        if (best.instructions) {
            return {
                triggered: true,
                score: 0.75,
                penalty: -30,
                name: this.name,
                reason: `${best.where} instructs the reader to open Run/terminal/File Explorer and paste something${best.captcha ? " to \"verify you are human\"" : ""} (ClickFix/FileFix pattern).`,
                metadata: best
            };
        }
        return {
            triggered: true,
            score: 0.6,
            penalty: -15,
            name: this.name,
            reason: `${best.where} contains a ready-to-run command line (PowerShell/mshta/curl-pipe) of the kind used in ClickFix lures.`,
            metadata: best
        };
    }
}
