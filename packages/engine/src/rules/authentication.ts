import type { Context } from "../context.ts";
import type { Evidence } from "../types.ts";
import { ATTACK, finding } from "./rule.ts";
import type { Rule } from "./rule.ts";

function authEvidence(ctx: Context): Evidence[] {
    const a = ctx.auth;
    const ev: Evidence[] = [];
    if (a.authservId) ev.push({ label: "Reported by", value: a.authservId, note: a.trust === "assumed" ? "top-most header, not independently verified" : undefined });
    ev.push({ label: "SPF", value: `${a.spf.result}${a.spf.domain ? ` (${a.spf.domain})` : ""}` });
    for (const d of a.dkim) ev.push({ label: "DKIM", value: `${d.result}${d.domain ? ` (d=${d.domain})` : ""}` });
    if (a.dkim.length === 0) ev.push({ label: "DKIM", value: "none" });
    ev.push({ label: "DMARC", value: `${a.dmarc.result}${a.dmarc.policy ? ` (policy ${a.dmarc.policy})` : ""}` });
    if (ctx.fromDomain) ev.push({ label: "From domain", value: ctx.fromDomain });
    return ev;
}

/**
 * ARC lets a forwarder (mailing list, security gateway) vouch that the message
 * authenticated before it was modified. Only the receiver's own arc=pass counts;
 * ARC headers in the message itself can be forged.
 */
export function forwardedWithValidArc(ctx: Context): boolean {
    const o = ctx.auth.arc.original;
    return ctx.auth.arc.result === "pass" && !!o && (o.dmarc === "pass" || o.dkim === "pass" || o.spf === "pass");
}

export const dmarcFailure: Rule = {
    meta: {
        id: "AUTH-001",
        title: "Sender authentication failed",
        category: "authentication",
        severity: "critical",
        attack: [ATTACK.impersonation],
        description:
            "The receiving server reported that the message failed DMARC (or SPF and DKIM when no DMARC result exists). The From domain was very likely used without the owner's permission.",
        falsePositives:
            "Forwarded mail and mailing lists can break SPF and DKIM. When the receiver validated an ARC chain showing the original message passed, the finding is reported as informational instead.",
    },
    run(ctx) {
        const a = ctx.auth;
        if (!a.present || a.trust === "none") return null;
        const ev = authEvidence(ctx);

        let failed = false;
        let summary = "";
        let severity: "low" | "medium" | "high" | "critical" = "high";
        if (a.dmarc.result === "fail") {
            failed = true;
            const enforced = a.dmarc.policy === "reject" || a.dmarc.policy === "quarantine";
            // The domain owner asked receivers to reject unauthenticated mail; this copy got through anyway.
            severity = a.dmarc.policy === "reject" ? "critical" : "high";
            summary = enforced
                ? `DMARC failed for ${ctx.fromDomain ?? "the From domain"}, whose owner asks receivers to ${a.dmarc.policy} such mail.`
                : `DMARC failed for ${ctx.fromDomain ?? "the From domain"}: neither SPF nor DKIM authenticated it.`;
        } else if (a.dmarc.result === "none" && a.compauth === "fail") {
            failed = true;
            summary = "Microsoft composite authentication (compauth) failed for the sender.";
        } else if (a.dmarc.result === "none") {
            if (a.spf.result === "fail" && !a.alignment.dkim) {
                failed = true;
                severity = "medium";
                summary = "SPF hard-failed and no aligned DKIM signature passed; the sending server was not authorized.";
            } else if (a.dkim.some((d) => d.result === "fail") && !a.alignment.dkim && !a.alignment.spf) {
                failed = true;
                severity = "medium";
                summary = "DKIM verification failed and nothing else authenticated the From domain.";
            } else if (a.spf.result === "softfail" && !a.alignment.dkim) {
                failed = true;
                severity = "low";
                summary = "SPF soft-failed and no aligned DKIM signature passed.";
            }
        }
        if (!failed) return null;

        if (forwardedWithValidArc(ctx)) {
            const o = a.arc.original!;
            return finding(
                this.meta,
                "info",
                `Authentication failed at delivery, but the receiver validated an ARC chain${a.arc.sealedBy[0] ? ` sealed by ${a.arc.sealedBy[0]}` : ""} showing the original message passed (SPF ${o.spf}, DKIM ${o.dkim}, DMARC ${o.dmarc}). This is typical of mailing lists and forwarding.`,
                ev,
            );
        }
        return finding(this.meta, severity, summary, ev, severity === "high" && a.dmarc.policy === "quarantine" ? 38 : undefined);
    },
};

export const notAligned: Rule = {
    meta: {
        id: "AUTH-002",
        title: "From domain not authenticated",
        category: "authentication",
        severity: "medium",
        attack: [ATTACK.impersonation],
        description:
            "No DMARC result was reported, and neither a passing SPF check nor a passing DKIM signature belongs to the From domain's organization. Nothing ties the visible sender to the server that sent it.",
        falsePositives: "Small domains without DMARC that send through a third-party service which does not sign with the customer's domain.",
    },
    run(ctx) {
        const a = ctx.auth;
        if (!a.present || a.trust === "none" || !ctx.fromOrg) return null;
        if (a.dmarc.result !== "none" || a.compauth) return null;
        if (a.alignment.dkim || a.alignment.spf) return null;
        // AUTH-001 already covers outright failures.
        if (a.spf.result === "fail" || a.spf.result === "softfail" || a.dkim.some((d) => d.result === "fail")) return null;
        if (forwardedWithValidArc(ctx)) return null;
        const passingOthers = [
            ...a.dkim.filter((d) => d.result === "pass" && d.domain).map((d) => `DKIM d=${d.domain}`),
            ...(a.spf.result === "pass" && a.spf.domain ? [`SPF ${a.spf.domain}`] : []),
        ];
        return finding(
            this.meta,
            passingOthers.length ? "low" : "medium",
            passingOthers.length
                ? `Authentication passed only for other domains (${passingOthers.join(", ")}), not for ${ctx.fromDomain}.`
                : `Nothing authenticated ${ctx.fromDomain}: no DMARC result and no passing SPF or DKIM for it.`,
            authEvidence(ctx),
        );
    },
};

export const authenticationRules: Rule[] = [dmarcFailure, notAligned];
