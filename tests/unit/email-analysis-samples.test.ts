import { readFileSync } from 'node:fs';
import path from 'node:path';
import PostalMime from 'postal-mime';
import { describe, expect, it } from 'vitest';
import { HeaderParser } from '@/lib/email/HeaderParser';
import { AnalysisEngine } from '@/lib/email/scoring/AnalysisEngine';

function sample(name: string): string {
    return readFileSync(path.join(process.cwd(), 'test-samples', name), 'utf8');
}

describe('Real .eml analysis fixtures', () => {
    it('parses Authentication-Results and ARC from PostalMime lower-case headers', async () => {
        const header = await HeaderParser.parse(sample('phish_alert_sp2_2.0.0.0 (17).eml'));

        expect(header.headers['authentication-results']).toBeDefined();
        expect(header.auth.spf.status).toBe('softfail');
        expect(header.auth.dkim.status).toBe('fail');
        expect(header.auth.dmarc.status).toBe('fail');
        expect(header.arc?.status).toBe('pass');
        expect(header.arc?.details).toEqual(expect.arrayContaining([
            'Origin SPF: pass',
            'Origin DKIM: pass'
        ]));
    });

    it('normalizes auth, ARC, sender, and timestamp signals from real samples', async () => {
        const raw = sample('phish_alert_sp2_2.0.0.0 (36).eml');
        const header = await HeaderParser.parse(raw);
        const email = await new PostalMime().parse(raw);
        const { signals, result } = await AnalysisEngine.analyze(header, email, {
            checkBody: true,
            checkAttachments: false
        });

        expect(signals.authenticationResultsPresent).toBe(true);
        expect(signals.fromDomain).toBe('qualtrics.com');
        expect(signals.arcResult).toBe('pass');
        expect(signals.arcOriginalSpf).toBe('pass');
        expect(signals.arcOriginalDkim).toBe('pass');
        expect(signals.receivedTimestampsValid).toBe(true);
        expect(result.trust.penalties.some(p => p.reason.startsWith('ARC Override'))).toBe(true);
    });

    it('keeps advanced detector tags mapped to visible penalty sections', async () => {
        const raw = [
            'Authentication-Results: mx.google.com; spf=pass smtp.mailfrom=example.com; dkim=pass header.d=example.com; dmarc=pass header.from=example.com',
            'Received: from mail.example.com (mail.example.com [203.0.113.10]) by mx.google.com with ESMTPS id abc; Mon, 1 Jan 2024 00:00:00 +0000',
            'From: Security Team <security@example.com>',
            'To: user@example.net',
            'Subject: Urgent password expiry',
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            '',
            '<html><body>Urgent password expiry. Click https://bit.ly/reset-now to continue.</body></html>'
        ].join('\r\n');

        const header = await HeaderParser.parse(raw);
        const email = await new PostalMime().parse(raw);
        const { result } = await AnalysisEngine.analyze(header, email, {
            checkBody: true,
            checkAttachments: false
        });

        const shortenerPenalty = result.trust.penalties.find(p => p.reason.includes('URL shortener'));
        expect(shortenerPenalty?.source).toBe('body');
        expect(shortenerPenalty?.tags).toContain('link');
    });
});
