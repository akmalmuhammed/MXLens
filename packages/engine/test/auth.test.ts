import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAuthenticationResults, stripComments, analyzeAuthentication } from "../src/parse/auth.ts";

test("stripComments removes nested comments but keeps quoted text", () => {
    assert.equal(stripComments("spf=pass (good: sender (really)) smtp.mailfrom=a.com").trim(), "spf=pass  smtp.mailfrom=a.com");
    assert.equal(stripComments('dkim=pass header.d="a(b).com"'), 'dkim=pass header.d="a(b).com"');
});

test("parseAuthenticationResults reads multiple DKIM results", () => {
    const parsed = parseAuthenticationResults(
        "mx.example.org; spf=pass smtp.mailfrom=bounce.example.com; dkim=pass header.d=example.com header.s=s1; dkim=fail header.d=other.com; dmarc=pass (p=REJECT sp=REJECT) header.from=example.com",
    );
    assert.equal(parsed.authservId, "mx.example.org");
    assert.deepEqual(parsed.results.filter((r) => r.method === "dkim").map((r) => r.result), ["pass", "fail"]);
    assert.equal(parsed.results.find((r) => r.method === "spf")?.props["smtp.mailfrom"], "bounce.example.com");
});

test("DMARC policy p=reject is not confused with sp=reject", () => {
    const info = analyzeAuthentication(
        { authenticationResults: ["mx.example.org; dmarc=pass (p=none sp=reject) header.from=example.com"], arcSeals: [], arcAuthResults: [], dkimSignatures: [], fromAddress: "a@example.com", returnPath: null },
        ["mx.example.org"],
    );
    assert.equal(info.dmarc.policy, "none");
});

test("relaxed DKIM alignment is computed against the From organizational domain", () => {
    const info = analyzeAuthentication(
        {
            authenticationResults: ["mx.example.org; spf=pass smtp.mailfrom=bounce.mkt.example.com; dkim=pass header.d=example.com; dmarc=pass header.from=example.com"],
            arcSeals: [], arcAuthResults: [], dkimSignatures: [], fromAddress: "news@mail.example.com", returnPath: "<bounce@mkt.example.com>",
        },
        ["mx.example.org"],
    );
    assert.ok(info.alignment.dkim);
});

test("trust is 'assumed' without configured authserv-ids and 'configured' with them", () => {
    const inputs = { authenticationResults: ["evil.example; spf=pass", "mx.example.org; spf=fail"], arcSeals: [], arcAuthResults: [], dkimSignatures: [], fromAddress: "a@b.com", returnPath: null };
    assert.equal(analyzeAuthentication(inputs, undefined).trust, "assumed");
    assert.equal(analyzeAuthentication(inputs, undefined).authservId, "evil.example");
    const configured = analyzeAuthentication(inputs, ["mx.example.org"]);
    assert.equal(configured.trust, "configured");
    assert.equal(configured.authservId, "mx.example.org");
});

test("ARC original results are read from the i=1 instance", () => {
    const info = analyzeAuthentication(
        {
            authenticationResults: ["mx.example.org; spf=fail; dkim=fail; dmarc=fail header.from=example.com; arc=pass"],
            arcSeals: ["i=1; cv=none; d=lists.example.net"],
            arcAuthResults: ["i=1; mx.origin.example; spf=pass smtp.mailfrom=a@example.com; dkim=pass header.d=example.com; dmarc=pass"],
            dkimSignatures: [], fromAddress: "a@example.com", returnPath: null,
        },
        ["mx.example.org"],
    );
    assert.equal(info.arc.result, "pass");
    assert.deepEqual(info.arc.original, { spf: "pass", dkim: "pass", dmarc: "pass" });
});
