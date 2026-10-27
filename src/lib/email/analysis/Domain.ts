/**
 * Best-effort organizational (registrable) domain without a public-suffix list:
 * handles the common two-letter-ccTLD pattern (example.co.uk) and otherwise keeps
 * the last two labels. Good enough for "same organization?" comparisons.
 */
export function organizationalDomain(domain: string): string {
    const labels = domain.toLowerCase().replace(/\.$/, "").split(".").filter(Boolean);
    if (labels.length <= 2) return labels.join(".");
    const secondLevel = labels[labels.length - 2];
    const takeThree = labels[labels.length - 1].length === 2 && ["co", "com", "org", "net", "ac", "gov", "edu"].includes(secondLevel);
    return labels.slice(takeThree ? -3 : -2).join(".");
}
