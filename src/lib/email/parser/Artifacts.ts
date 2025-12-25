import { AnalysisResult, EmailHop } from "../HeaderParser";

export class ArtifactExtractor {
    static extract(headers: any, hops: EmailHop[]): AnalysisResult['artifacts'] {
        const artifacts: AnalysisResult['artifacts'] = [];
        const seen = new Set();
        const ipRegex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])/g;

        const add = (type: string, value: string, label?: string) => {
            if (value && !seen.has(value)) {
                if (type === 'ip' && (value === '127.0.0.1' || value.startsWith('0.'))) return;
                artifacts.push({ type, value, label });
                seen.add(value);
            }
        };

        hops.forEach(hop => {
            if (hop.ip) add('ip', hop.ip, `Hop: ${hop.from}`);
        });

        const interestKeys = ['Authentication-Results', 'Arc-Authentication-Results', 'Received-SPF', 'X-Originating-IP', 'X-Sender-IP', 'X-Client-IP'];
        interestKeys.forEach(key => {
            const foundKey = Object.keys(headers).find(k => k.toLowerCase() === key.toLowerCase());
            if (foundKey) {
                const val = headers[foundKey];
                const strVal = Array.isArray(val) ? val.join(' ') : val;

                const matches = strVal.match(ipRegex);
                if (matches) {
                    matches.forEach((ip: string) => add('ip', ip, `${key} Artifact`));
                }
            }
        });

        if (headers['Message-ID']) {
            add('message-id', headers['Message-ID'].replace(/[<>]/g, ''), 'Message-ID');
        }

        if (headers['Return-Path']) {
            add('email', headers['Return-Path'].replace(/[<>]/g, ''), 'Return-Path');
        }

        ['From', 'To', 'Reply-To'].forEach(key => {
            if (headers[key]) {
                const emailMatch = headers[key].match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
                if (emailMatch) add('email', emailMatch[1], key);
            }
        });

        return artifacts;
    }
}
