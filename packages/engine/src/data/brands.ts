/**
 * Frequently impersonated brands and the registrable domains they really send
 * from and link to.
 *
 * Rules use this list to recognise impersonation (a brand name in the display
 * name, or a lookalike domain) and to avoid flagging the brand's own mail.
 *
 * Keep entries factual: only add domains the brand verifiably owns. Free-mail
 * domains (gmail.com, outlook.com, icloud.com, ...) are deliberately excluded,
 * because anyone can register an address there.
 */

export interface Brand {
    name: string;
    /** Registrable domains owned by the brand (matched as domain or subdomain). */
    domains: string[];
    /** Lower-case words or phrases that name the brand in a display name or text. */
    keywords: string[];
}

export const BRANDS: Brand[] = [
    {
        name: "Microsoft",
        domains: [
            "microsoft.com", "microsoftonline.com", "office.com", "office365.com",
            "microsoft365.com", "sharepoint.com", "onedrive.com", "azure.com", "live.com",
            "windows.com", "aka.ms", "microsoftstore.com", "skype.com", "bing.com",
        ],
        keywords: ["microsoft", "office 365", "office365", "microsoft 365", "onedrive", "sharepoint", "outlook", "ms teams", "azure"],
    },
    {
        name: "Google",
        domains: ["google.com", "youtube.com", "googlemail.com", "withgoogle.com", "g.co", "goo.gl", "google.co.uk"],
        keywords: ["google", "gmail", "google workspace", "g suite", "google drive", "google docs"],
    },
    { name: "Apple", domains: ["apple.com", "itunes.com"], keywords: ["apple", "icloud", "itunes", "app store", "apple id"] },
    { name: "PayPal", domains: ["paypal.com", "paypal.me", "paypalobjects.com", "paypal-communication.com"], keywords: ["paypal"] },
    {
        name: "Amazon",
        domains: [
            "amazon.com", "amazon.co.uk", "amazon.de", "amazon.ca", "amazon.in", "amazon.ae", "amazon.sa",
            "amazon.fr", "amazon.it", "amazon.es", "amazon.co.jp", "amazon.com.au", "amazonses.com",
            "amazonaws.com", "amzn.to", "primevideo.com",
        ],
        keywords: ["amazon", "prime video", "amazon prime", "aws"],
    },
    { name: "DHL", domains: ["dhl.com", "dhl.de", "dhl.co.uk"], keywords: ["dhl"] },
    { name: "FedEx", domains: ["fedex.com"], keywords: ["fedex"] },
    { name: "UPS", domains: ["ups.com"], keywords: ["ups delivery", "ups package", "ups shipment"] },
    { name: "USPS", domains: ["usps.com"], keywords: ["usps", "postal service"] },
    { name: "Royal Mail", domains: ["royalmail.com", "royalmail.co.uk"], keywords: ["royal mail"] },
    { name: "Aramex", domains: ["aramex.com"], keywords: ["aramex"] },
    { name: "DocuSign", domains: ["docusign.com", "docusign.net"], keywords: ["docusign"] },
    { name: "Adobe", domains: ["adobe.com", "adobesign.com", "echosign.com"], keywords: ["adobe", "adobe sign", "acrobat"] },
    { name: "Dropbox", domains: ["dropbox.com", "dropboxmail.com"], keywords: ["dropbox"] },
    { name: "WeTransfer", domains: ["wetransfer.com"], keywords: ["wetransfer"] },
    { name: "LinkedIn", domains: ["linkedin.com", "lnkd.in"], keywords: ["linkedin"] },
    {
        name: "Meta",
        domains: ["facebook.com", "facebookmail.com", "fb.com", "fb.me", "meta.com", "instagram.com", "whatsapp.com"],
        keywords: ["facebook", "instagram", "whatsapp", "meta business", "meta support"],
    },
    { name: "X", domains: ["x.com", "twitter.com", "t.co"], keywords: ["twitter"] },
    { name: "Netflix", domains: ["netflix.com"], keywords: ["netflix"] },
    { name: "Chase", domains: ["chase.com", "jpmorganchase.com"], keywords: ["chase bank", "jpmorgan chase"] },
    { name: "Wells Fargo", domains: ["wellsfargo.com"], keywords: ["wells fargo"] },
    { name: "Bank of America", domains: ["bankofamerica.com", "bofa.com"], keywords: ["bank of america"] },
    { name: "Citi", domains: ["citi.com", "citibank.com"], keywords: ["citibank"] },
    { name: "HSBC", domains: ["hsbc.com", "hsbc.co.uk"], keywords: ["hsbc"] },
    { name: "Coinbase", domains: ["coinbase.com"], keywords: ["coinbase"] },
    { name: "Binance", domains: ["binance.com"], keywords: ["binance"] },
    { name: "MetaMask", domains: ["metamask.io"], keywords: ["metamask"] },
    { name: "Zoom", domains: ["zoom.us", "zoom.com"], keywords: ["zoom meeting", "zoom video"] },
    { name: "Slack", domains: ["slack.com"], keywords: ["slack"] },
    { name: "GitHub", domains: ["github.com"], keywords: ["github"] },
    { name: "Atlassian", domains: ["atlassian.com", "atlassian.net", "jira.com"], keywords: ["atlassian", "jira", "confluence"] },
    { name: "Okta", domains: ["okta.com"], keywords: ["okta"] },
    { name: "Salesforce", domains: ["salesforce.com"], keywords: ["salesforce"] },
    { name: "Intuit", domains: ["intuit.com"], keywords: ["intuit", "quickbooks", "turbotax"] },
    { name: "Norton", domains: ["norton.com", "nortonlifelock.com", "gen.com"], keywords: ["norton"] },
    { name: "McAfee", domains: ["mcafee.com"], keywords: ["mcafee"] },
    { name: "Best Buy", domains: ["bestbuy.com"], keywords: ["geek squad", "geeksquad", "best buy"] },
    { name: "eBay", domains: ["ebay.com", "ebay.co.uk"], keywords: ["ebay"] },
    { name: "Stripe", domains: ["stripe.com"], keywords: ["stripe"] },
    { name: "Shopify", domains: ["shopify.com"], keywords: ["shopify"] },
    { name: "Steam", domains: ["steampowered.com", "steamcommunity.com"], keywords: ["steam support", "steam community"] },
    { name: "IRS", domains: ["irs.gov"], keywords: ["irs", "internal revenue service"] },
    { name: "HMRC", domains: ["hmrc.gov.uk"], keywords: ["hmrc"] },
];

/**
 * Words attackers bolt onto a brand name to build a "combosquat" domain such as
 * paypal-secure-login.com. A brand token next to one of these is suspicious;
 * a brand token next to anything else (appleton.edu) is not.
 */
export const LURE_TOKENS = new Set([
    "secure", "security", "login", "logon", "signin", "sign", "verify", "verification",
    "account", "accounts", "support", "help", "helpdesk", "desk", "service", "services",
    "update", "billing", "invoice", "payment", "pay", "wallet", "auth", "online", "alert",
    "alerts", "notice", "notification", "mail", "team", "id", "document", "docs", "share",
    "file", "files", "drive", "cloud", "admin", "it", "portal", "center", "centre", "review",
    "recovery", "unlock", "confirm", "office", "web", "app", "my", "access", "session",
    "customer", "care", "refund", "delivery", "parcel", "tracking", "track", "shipment",
    "envelope", "sign-in", "esign",
]);
