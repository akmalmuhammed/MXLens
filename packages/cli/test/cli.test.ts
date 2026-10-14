import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const entry = join(here, "..", "src", "index.ts");
const corpus = join(here, "..", "..", "..", "corpus");

function run(args: string[], input?: string): { code: number; out: string; err: string } {
    const r = spawnSync(process.execPath, ["--experimental-strip-types", "--no-warnings", entry, ...args], {
        input,
        encoding: "utf8",
        env: { ...process.env, NO_COLOR: "1" },
    });
    return { code: r.status ?? -1, out: r.stdout, err: r.stderr };
}

test("phishing file exits 1 by default", () => {
    const r = run([join(corpus, "phishing", "01-spoofed-paypal-dmarc-fail.eml"), "--no-color"]);
    assert.equal(r.code, 1);
    assert.match(r.out, /PHISHING|SUSPICIOUS/i);
});

test("legitimate file exits 0", () => {
    assert.equal(run([join(corpus, "legitimate", "02-paypal-receipt.eml"), "-q"]).code, 0);
});

test("reads from stdin", () => {
    const eml = readFileSync(join(corpus, "phishing", "16-double-ext-rtlo.eml"), "utf8");
    const r = run(["-", "-q"], eml);
    assert.equal(r.code, 1);
});

test("--format json emits parseable JSON", () => {
    const parsed = JSON.parse(run([join(corpus, "phishing", "10-raw-ip-url.eml"), "-f", "json"]).out);
    assert.ok(["malicious", "suspicious", "clean"].includes(parsed.verdict));
    assert.equal(parsed.schemaVersion, "1.0");
});

test("--format stix emits a STIX 2.1 bundle", () => {
    const bundle = JSON.parse(run([join(corpus, "phishing", "10-raw-ip-url.eml"), "-f", "stix"]).out);
    assert.equal(bundle.type, "bundle");
    assert.ok(bundle.objects.length > 0 && bundle.objects.every((o: { spec_version: string }) => o.spec_version === "2.1"));
});

test("--fail-on suspicious raises the exit code", () => {
    assert.equal(run([join(corpus, "phishing", "20-fake-reply-payment-change.eml"), "--fail-on", "suspicious", "-q"]).code, 1);
});

test("--help, --version and --rules exit 0", () => {
    assert.equal(run(["--help"]).code, 0);
    assert.equal(run(["--version"]).code, 0);
    assert.match(run(["--rules"]).out, /AUTH-001/);
});

test("unknown option exits 2", () => {
    assert.equal(run(["--bogus"]).code, 2);
});
