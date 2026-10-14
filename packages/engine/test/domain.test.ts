import { test } from "node:test";
import assert from "node:assert/strict";
import {
    registrableDomain, isSameOrSubdomain, findLookalike, brandInHostLabels, isLureWordDomain,
    toUnicodeHost, isPrivateIp, isIpLiteral, editDistance, skeleton, isFreemail,
} from "../src/lib/domain.ts";

test("registrableDomain uses the public suffix list", () => {
    assert.equal(registrableDomain("www.amazon.co.uk"), "amazon.co.uk");
    assert.equal(registrableDomain("login.example.com"), "example.com");
    assert.equal(registrableDomain("a.b.github.io"), "b.github.io"); // private suffix
    assert.equal(registrableDomain("203.0.113.5"), null);
});

test("subdomain matching is not a substring test", () => {
    assert.ok(isSameOrSubdomain("mail.paypal.com", "paypal.com"));
    assert.ok(!isSameOrSubdomain("paypal.com.evil.net", "paypal.com"));
    assert.ok(!isSameOrSubdomain("notpaypal.com", "paypal.com"));
});

test("findLookalike catches typosquats and combosquats but not the real domain", () => {
    assert.equal(findLookalike("paypal.com"), null);
    assert.equal(findLookalike("paypa1-secure-login.com")?.kind, "combosquat");
    assert.equal(findLookalike("micros0ft-support.net")?.kind, "combosquat");
    assert.equal(findLookalike("rnicrosoft.com")?.brand.name, "Microsoft");
    // Unrelated domains one edit from a short brand must not match.
    assert.equal(findLookalike("example.com"), null);
    assert.equal(findLookalike("apple.ca"), null); // real Apple ccTLD-style is not flagged by name alone
});

test("findLookalike decodes punycode homographs", () => {
    const hit = findLookalike("xn--paypl-7ve.com"); // paypal with a Cyrillic а
    assert.equal(hit?.kind, "homograph");
    assert.equal(hit?.brand.name, "PayPal");
    assert.ok(toUnicodeHost("xn--paypl-7ve.com").includes("pa"));
});

test("brandInHostLabels catches brand used as a decoy label", () => {
    assert.equal(brandInHostLabels("paypal.com.account-check.net")?.brand.name, "PayPal");
    assert.equal(brandInHostLabels("login.microsoftonline.secure-auth.top")?.brand.name, "Microsoft");
    assert.equal(brandInHostLabels("mail.paypal.com"), null); // real subdomain
});

test("isLureWordDomain flags vocabulary-only domains", () => {
    assert.ok(isLureWordDomain("account-verify-center.xyz"));
    assert.ok(isLureWordDomain("secure-billing-update.info"));
    assert.ok(!isLureWordDomain("brightleaf-coffee.com"));
    assert.ok(!isLureWordDomain("paypal.com"));
});

test("isPrivateIp distinguishes private from public", () => {
    for (const ip of ["10.0.0.1", "192.168.1.1", "172.16.5.4", "127.0.0.1", "169.254.1.1", "100.64.0.1", "::1"]) {
        assert.ok(isPrivateIp(ip), `${ip} should be private`);
    }
    for (const ip of ["8.8.8.8", "203.0.113.5", "172.32.0.1"]) {
        assert.ok(!isPrivateIp(ip), `${ip} should be public`);
    }
});

test("isIpLiteral recognizes obfuscated forms", () => {
    assert.ok(isIpLiteral("203.0.113.5"));
    assert.ok(isIpLiteral("3232235777")); // decimal
    assert.ok(isIpLiteral("0xC0A80001")); // hex
    assert.ok(!isIpLiteral("example.com"));
});

test("editDistance and skeleton helpers", () => {
    assert.equal(editDistance("paypal", "paypa1"), 1);
    assert.equal(skeleton("rnicrosoft"), "microsoft");
    assert.equal(skeleton("paypa1"), "paypal");
});

test("isFreemail", () => {
    assert.ok(isFreemail("gmail.com"));
    assert.ok(isFreemail("fan.hotmail.com"));
    assert.ok(!isFreemail("example.com"));
});
