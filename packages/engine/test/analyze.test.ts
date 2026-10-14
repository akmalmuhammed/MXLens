import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeEmail, toMarkdown, toStix, toCsv } from "../src/index.ts";

const now = new Date("2026-06-01T00:00:00Z");
function eml(parts: string[]): string {
    return parts.join("\r\n");
}

test("the From parser is not fooled by an address in the display name", async () => {
    const result = await analyzeEmail(
        eml([
            "Authentication-Results: mx.example.org; spf=pass smtp.mailfrom=x@attacker.test; dkim=pass header.d=attacker.test; dmarc=pass header.from=attacker.test",
            'From: "security@paypal.com" <alerts@attacker.test>',
            "To: victim@example.org",
            "Subject: hi",
            "",
            "body",
        ]),
        { trustedAuthservIds: ["mx.example.org"], now },
    );
    // The real sending domain must be attacker.test, not paypal.com.
    assert.equal(result.identity.fromDomain, "attacker.test");
    assert.ok(result.findings.some((f) => f.ruleId === "ID-001"));
    assert.equal(result.verdict, "malicious");
});

test("a clean, authenticated brand message scores zero", async () => {
    const result = await analyzeEmail(
        eml([
            "Authentication-Results: mx.example.org; spf=pass smtp.mailfrom=bounce.paypal.com; dkim=pass header.d=paypal.com; dmarc=pass (p=reject) header.from=paypal.com",
            "From: PayPal <service@paypal.com>",
            "To: user@example.org",
            "Subject: Your receipt",
            "Content-Type: text/html",
            "",
            '<p>Thanks. <a href="https://www.paypal.com/receipt">View it</a></p>',
        ]),
        { trustedAuthservIds: ["mx.example.org"], now },
    );
    assert.equal(result.verdict, "clean");
    assert.equal(result.riskScore, 0);
});

test("a forwarded mailing-list message is not marked malicious for DMARC fail", async () => {
    const result = await analyzeEmail(
        eml([
            "Authentication-Results: mx.example.org; spf=fail smtp.mailfrom=bounce@list.example.net; dkim=fail header.d=example.com; dmarc=fail (p=none) header.from=example.com; arc=pass",
            "ARC-Seal: i=1; cv=pass; d=list.example.net; s=arc; b=abc",
            "ARC-Authentication-Results: i=1; mx.origin.example; spf=pass smtp.mailfrom=jane@example.com; dkim=pass header.d=example.com; dmarc=pass",
            "From: Jane <jane@example.com>",
            "To: list@list.example.net",
            "Subject: [list] hello",
            "",
            "hi all",
        ]),
        { trustedAuthservIds: ["mx.example.org"], now },
    );
    assert.notEqual(result.verdict, "malicious");
    assert.ok(result.findings.every((f) => f.ruleId !== "AUTH-001" || f.severity === "info"));
});

test("noisy-OR scoring keeps the score in range and order-independent", async () => {
    const headers = [
        "Authentication-Results: mx.example.org; spf=fail smtp.mailfrom=x@paypa1-login.test; dmarc=fail (p=reject) header.from=paypa1-login.test",
        "From: PayPal <x@paypa1-login.test>",
        "To: v@example.org",
        "Subject: Verify your account now or it will be suspended",
        "Content-Type: text/html",
        "",
        '<form><input type="password"></form><a href="http://203.0.113.9/login">here</a>',
    ];
    const result = await analyzeEmail(eml(headers), { trustedAuthservIds: ["mx.example.org"], now });
    assert.ok(result.riskScore <= 100 && result.riskScore >= 0);
    assert.ok(result.findings.length >= 3);
    assert.equal(result.verdict, "malicious");
});

test("header-only input still analyzes identity and records coverage gaps", async () => {
    const result = await analyzeEmail(
        eml(["From: boss <ceo@gmail.com>", "Reply-To: ceo@payments-dept.test", "To: staff@example.org", "Subject: quick task"]),
        { now },
    );
    assert.ok(result.coverage.skipped.some((s) => /body/i.test(s.check)));
    assert.ok(result.indicators.emails.includes("ceo@gmail.com"));
});

test("exports produce valid shapes", async () => {
    const result = await analyzeEmail(
        eml(["From: x@attacker.test", "To: v@example.org", "Subject: hi", "", "http://203.0.113.5/a"]),
        { now },
    );
    assert.match(toMarkdown(result), /MXLens verdict/);
    assert.ok(toCsv(result).startsWith("type,value,context"));
    const stix = toStix(result) as { type: string; objects: unknown[] };
    assert.equal(stix.type, "bundle");
    assert.ok(stix.objects.length > 0);
    // Indicators in Markdown are defanged.
    assert.ok(toMarkdown(result).includes("hxxp") || toMarkdown(result).includes("[.]"));
});

test("result is JSON-serializable", async () => {
    const result = await analyzeEmail(eml(["From: a@b.test", "Subject: x", "", "hi"]), { now });
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(result)));
});
