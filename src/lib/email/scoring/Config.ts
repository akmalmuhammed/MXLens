export const HIGH_VALUE_BRANDS = [
    'microsoft', 'google', 'paypal', 'amazon', 'apple',
    'meta', 'facebook', 'netflix', 'adobe',
    'bank of america', 'chase', 'wells fargo', 'citibank',
    'visa', 'mastercard', 'amex', 'discover',
    'stripe', 'square', 'coinbase', 'fedex', 'dhl', 'ups'
];

export const FREE_PROVIDERS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'aol.com', 'mail.com', 'protonmail.com', 'icloud.com', 'me.com', 'live.com', 'msn.com',
    'yandex.com', 'yandex.ru', 'qq.com', '163.com'
];

export const HIGH_VALUE_ROLES = [
    'ceo', 'cfo', 'president', 'director', 'executive',
    'finance', 'accounting', 'payroll', 'hr', 'legal', 'security', 'admin'
];

export const TRUSTED_MAIL_SERVERS = [
    'outlook.com',
    'gmail.com',
    'protection.outlook.com',
    'google.com',
    'mimecast.com',
    'proofpoint.com',
    'ironport', // generic substring match might be needed
    'barracuda',
    'mdaemons',
    'sendgrid',
    'amazonses'
];

/**
 * True when an Authentication-Results authserv-id belongs to a well-known mail
 * provider. Domain entries must match on a label boundary, so
 * "google.com.attacker.example" is not trusted; dotless entries match any label
 * that contains them (vendor appliance hostnames vary).
 */
export function isKnownAuthServ(id: string): boolean {
    const host = id.trim().toLowerCase().replace(/\.$/, "");
    return TRUSTED_MAIL_SERVERS.some(trusted =>
        trusted.includes(".")
            ? host === trusted || host.endsWith(`.${trusted}`)
            : host.split(".").some(label => label.includes(trusted))
    );
}

export const LEGITIMATE_SHORTENERS = [
    'bit.ly', 'goo.gl', 'tinyurl.com', 'ow.ly', 't.co',
    'buff.ly', 'youtu.be', 'amzn.to', 'aka.ms',
    'go.microsoft.com', 'links.email', 'click.email',
    'r20.rs6.net'
];
