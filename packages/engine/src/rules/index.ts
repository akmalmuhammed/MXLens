import type { RuleMeta } from "../types.ts";
import { authenticationRules } from "./authentication.ts";
import { identityRules } from "./identity.ts";
import { linkRules } from "./links.ts";
import { attachmentRules } from "./attachments.ts";
import { contentRules } from "./content.ts";
import { headerRules } from "./headers.ts";
import type { Rule } from "./rule.ts";

export const RULES: Rule[] = [
    ...authenticationRules,
    ...identityRules,
    ...linkRules,
    ...attachmentRules,
    ...contentRules,
    ...headerRules,
];

/** Metadata for every rule, for documentation and UIs. */
export function listRules(): RuleMeta[] {
    return RULES.map((r) => r.meta);
}

export type { Rule } from "./rule.ts";
