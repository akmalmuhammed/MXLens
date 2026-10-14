import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { decodeInput, digest, runAnalyze } from "../src/analyze.ts";
import { analyzeEmail } from "@mxlens/engine";

const corpus = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "corpus");
const sample = (rel: string) => readFileSync(join(corpus, rel), "utf8");

test("decodeInput handles raw text and base64", () => {
    assert.ok(new TextDecoder().decode(decodeInput("From: a@b.com\r\n\r\nhi", "auto")).startsWith("From:"));
    const b64 = Buffer.from("From: a@b.com\r\nSubject: x\r\n\r\nbody text that is long enough to look like base64 maybe").toString("base64");
    assert.ok(new TextDecoder().decode(decodeInput(b64, "base64")).startsWith("From:"));
});

test("digest exposes verdict, findings and indicators", async () => {
    const result = await analyzeEmail(sample("phishing/08-link-text-mismatch.eml"));
    const d = digest(result) as Record<string, any>;
    assert.ok(["malicious", "suspicious", "clean"].includes(d.verdict));
    assert.ok(Array.isArray(d.findings) && d.findings[0].id);
    assert.ok(d.indicators.urls.length > 0);
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(d)));
});

test("runAnalyze returns all output formats", async () => {
    const eml = sample("phishing/10-raw-ip-url.eml");
    assert.match((await runAnalyze({ email: eml, format: "markdown" })).text, /MXLens verdict/);
    assert.equal(JSON.parse((await runAnalyze({ email: eml, format: "stix" })).text).type, "bundle");
    assert.ok(["malicious", "suspicious"].includes(JSON.parse((await runAnalyze({ email: eml, format: "summary" })).text).verdict));
    const full = JSON.parse((await runAnalyze({ email: eml, format: "full" })).text);
    assert.equal(full.schemaVersion, "1.0");
});

test("trustedAuthservIds is honoured", async () => {
    const eml = sample("legitimate/02-paypal-receipt.eml");
    const trusted = await runAnalyze({ email: eml, trustedAuthservIds: ["mx.example.org"] });
    assert.equal((trusted.structured.authentication as { trust: string }).trust, "configured");
});
