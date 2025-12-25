import { EmailHop } from "../HeaderParser";

export class HopTracer {
    static analyze(receivedHeaders: string | string[]): EmailHop[] {
        if (!receivedHeaders) return [];
        const headers = Array.isArray(receivedHeaders) ? receivedHeaders : [receivedHeaders];
        const hops: EmailHop[] = [];

        headers.forEach(header => {
            // Simplified parsing strategy
            const fromMatch = header.match(/from\s+([^\s]+)/i);
            const byMatch = header.match(/by\s+([^\s]+)/i);
            // Date is usually after the semicolon
            const datePart = header.split(';').pop()?.trim();

            const ipMatch = header.match(/(?:\[|\()(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?:\]|\))/);

            if (datePart) {
                const date = new Date(datePart);
                if (!isNaN(date.getTime())) {
                    hops.push({
                        from: fromMatch ? fromMatch[1] : 'unknown',
                        by: byMatch ? byMatch[1] : 'unknown',
                        time: date.toISOString(),
                        timestamp: date.getTime(),
                        delay: 0,
                        ip: ipMatch ? ipMatch[1] : undefined
                    });
                }
            }
        });

        // Sort by time (oldest first)
        hops.sort((a, b) => a.timestamp - b.timestamp);

        // Calculate delays and annotations
        for (let i = 0; i < hops.length; i++) {
            const hop = hops[i];
            hop.annotations = [];

            // Delay Check (skip first hop)
            if (i > 0) {
                const diff = (hop.timestamp - hops[i - 1].timestamp) / 1000;
                hop.delay = diff > 0 ? diff : 0;

                if (hop.delay > 600) { // 10 minutes
                    hop.annotations.push("Long Delay (>10m)");
                }
            }

            // IP Check (RFC1918)
            if (hop.ip) {
                if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hop.ip)) {
                    hop.annotations.push("Internal IP");
                }
            }
        }

        return hops;
    }
}
