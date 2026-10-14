export type HeaderValue = string | string[] | undefined;
export type HeaderMap = Record<string, string | string[]>;

export function getHeaderValue(headers: HeaderMap | undefined, key: string): HeaderValue {
    if (!headers) return undefined;

    if (Object.prototype.hasOwnProperty.call(headers, key)) {
        return headers[key];
    }

    const lowerKey = key.toLowerCase();
    const foundKey = Object.keys(headers).find(k => k.toLowerCase() === lowerKey);
    return foundKey ? headers[foundKey] : undefined;
}

export function getHeaderValues(headers: HeaderMap | undefined, key: string): string[] {
    const value = getHeaderValue(headers, key);
    if (!value) return [];
    return Array.isArray(value) ? value.map(String) : [String(value)];
}

export function getFirstHeaderValue(headers: HeaderMap | undefined, key: string): string {
    return getHeaderValues(headers, key)[0] || "";
}
