import { readFileSync } from 'node:fs';
import path from 'node:path';
import PostalMime from 'postal-mime';
import { describe, expect, it } from 'vitest';
import { HeaderParser } from '@/lib/email/HeaderParser';
import { AnalysisEngine } from '@/lib/email/scoring/AnalysisEngine';

const forwardedAuthFailure = [
    'Authentication-Results: mx.example.test; spf=softfail smtp.mailfrom=sender.example.test; dkim=fail header.d=sender.example.test; dmarc=fail header.from=sender.example.test',
    'ARC-Authentication-Results: i=1; mx.example.test; spf=pass smtp.mailfrom=sender.example.test; dkim=pass header.d=sender.example.test',
    'ARC-Seal: i=1; a=rsa-sha256; cv=pass; d=forwarder.example.test; s=arc',
    'Received: from relay.example.test (relay.example.test [203.0.113.10]) by mx.example.test; Mon, 1 Jan 2024 00:00:00 +0000',
    'From: Example Sender <sender@sender.example.test>',
    'To: recipient@example.test',
    'Subject: Forwarded message',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    '',
    'Synthetic forwarding regression fixture.'
].join('\r\n');

describe('Synthetic email analysis regressions', () => {
    it('parses Authentication-Results and ARC from normalized headers', async () => {
        const header = await HeaderParser.parse(forwardedAuthFailure);

        expect(header.auth.spf.status).toBe('softfail');
        expect(header.auth.dkim.status).toBe('fail');
        expect(header.auth.dmarc.status).toBe('fail');
        expect(header.arc?.status).toBe('pass');
        expect(header.arc?.details).toEqual(expect.arrayContaining([
            'Origin SPF: pass',
            'Origin DKIM: pass'
        ]));
    });

    it('restores auth penalties only when ARC records origin passes', async () => {
        const header = await HeaderParser.parse(forwardedAuthFailure);
        const email = await new PostalMime().parse(forwardedAuthFailure);
        const { signals, result } = await AnalysisEngine.analyze(header, email, {
            checkBody: true,
            checkAttachments: false
        });

        expect(signals.fromDomain).toBe('sender.example.test');
        expect(signals.arcOriginalSpf).toBe('pass');
        expect(signals.arcOriginalDkim).toBe('pass');
        expect(result.trust.penalties.some(p => p.reason.startsWith('ARC Override'))).toBe(true);
    });

    it('normalizes enforced DMARC action and reports enforcement failure', async () => {
        const raw = forwardedAuthFailure.replace(
            'dmarc=fail header.from=sender.example.test',
            'dmarc=fail action=oreject; p=reject header.from=sender.example.test'
        );
        const header = await HeaderParser.parse(raw);
        const email = await new PostalMime().parse(raw);
        const { signals, result } = await AnalysisEngine.analyze(header, email, {
            checkBody: false,
            checkAttachments: false
        });

        expect(signals.dmarcPolicy).toBe('reject');
        expect(result.verdict.verdict).toBe('High Risk');
    });

    it('does not expose the message body as raw headers or inspect attachments when disabled', async () => {
        const raw = [
            'From: sender@example.test',
            'Subject: Fixture',
            'Content-Type: text/plain',
            '',
            'PRIVATE BODY SENTINEL'
        ].join('\r\n');
        const header = await HeaderParser.parse(raw, { checkAttachments: false });

        expect(header.rawHeaders).not.toContain('PRIVATE BODY SENTINEL');
        expect(header.attachments).toEqual([]);
    });

    it('keeps advanced detector tags mapped to visible penalty sections', async () => {
        const raw = [
            'Authentication-Results: mx.example.test; spf=pass smtp.mailfrom=example.test; dkim=pass header.d=example.test; dmarc=pass header.from=example.test',
            'Received: from mail.example.test (mail.example.test [203.0.113.10]) by mx.example.test with ESMTPS id abc; Mon, 1 Jan 2024 00:00:00 +0000',
            'From: Security Team <security@example.test>',
            'To: user@example.test',
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

function sample(name: string): string {
    return readFileSync(path.join(process.cwd(), 'tests', 'fixtures', 'email', name), 'utf8');
}

describe('Synthetic .eml analysis fixtures', () => {
    it('parses Authentication-Results and ARC from PostalMime lower-case headers', async () => {
        const header = await HeaderParser.parse(sample('arc-forwarded-list.eml'));

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
        const raw = sample('arc-forwarded-list.eml');
        const header = await HeaderParser.parse(raw);
        const email = await new PostalMime().parse(raw);
        const { signals, result } = await AnalysisEngine.analyze(header, email, {
            checkBody: true,
            checkAttachments: false
        });

        expect(signals.authenticationResultsPresent).toBe(true);
        expect(signals.fromDomain).toBe('example.com');
        expect(signals.arcResult).toBe('pass');
        expect(signals.arcOriginalSpf).toBe('pass');
        expect(signals.arcOriginalDkim).toBe('pass');
        expect(signals.receivedTimestampsValid).toBe(true);
        expect(result.trust.penalties.some(p => p.reason.startsWith('ARC Override'))).toBe(true);
    });
});
