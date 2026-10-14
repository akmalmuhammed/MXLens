import { ATTACK, finding } from "./rule.ts";
import type { Rule } from "./rule.ts";

export const fakeReply: Rule = {
    meta: {
        id: "HDR-001",
        title: "Looks like a reply but starts a new thread",
        category: "headers",
        severity: "medium",
        attack: [ATTACK.impersonation],
        description:
            'The subject starts with "Re:" or "Fwd:" but the message has none of the headers a real reply carries (In-Reply-To, References, Thread-Index). Attackers fake a conversation to borrow trust.',
        falsePositives: "Some mobile and web clients drop threading headers; reported at low severity unless combined with other signals.",
    },
    run(ctx) {
        const subject = ctx.message.subject ?? "";
        if (!/^\s*(re|fw|fwd|aw|sv|tr)\s*(\[\d+\])?\s*:/i.test(subject)) return null;
        if (ctx.message.inReplyTo || ctx.message.references || ctx.headers.has("thread-index") || ctx.headers.has("thread-topic")) return null;
        return finding(this.meta, "low", `The subject "${subject.slice(0, 80)}" suggests an ongoing conversation, but the message carries no reply headers.`, [
            { label: "Subject", value: subject },
            { label: "In-Reply-To / References", value: "missing" },
        ], 10);
    },
};

export const timeAnomaly: Rule = {
    meta: {
        id: "HDR-002",
        title: "Delivery timestamps do not add up",
        category: "headers",
        severity: "low",
        attack: [ATTACK.masquerading],
        description: "A relay's timestamp is far earlier than the previous hop, or a date lies in the future. This can indicate forged Received headers.",
        falsePositives: "Servers with wrong clocks.",
    },
    run(ctx) {
        const issues: string[] = [];
        for (const hop of ctx.hops) {
            if (hop.delaySeconds !== null && hop.delaySeconds < -600) issues.push(`hop ${hop.index} is ${Math.round(-hop.delaySeconds / 60)} minutes earlier than the hop before it`);
            if (hop.timestamp && Date.parse(hop.timestamp) - ctx.now.getTime() > 24 * 3600 * 1000) issues.push(`hop ${hop.index} is dated in the future (${hop.timestamp})`);
        }
        if (issues.length === 0) return null;
        return finding(this.meta, "low", `Delivery timestamps are inconsistent: ${issues[0]}.`, issues.map((i) => ({ label: "Timestamp", value: i })), 5);
    },
};

export const headerRules: Rule[] = [fakeReply, timeAnomaly];
