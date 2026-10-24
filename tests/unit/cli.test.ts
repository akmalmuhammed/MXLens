import { mkdtempSync, copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { run } from "../../cli/src/main";

const samples = path.join(process.cwd(), "public", "samples");

function makeIo(stdin = "") {
    const out: string[] = [];
    const err: string[] = [];
    return {
        io: {
            stdout: (text: string) => void out.push(text),
            stderr: (text: string) => void err.push(text),
            readStdin: async () => stdin,
            color: false,
        },
        stdout: () => out.join(""),
        stderr: () => err.join(""),
    };
}

function inbox() {
    const dir = mkdtempSync(path.join(tmpdir(), "mxlens-cli-"));
    mkdirSync(path.join(dir, "nested"));
    copyFileSync(path.join(samples, "demo-phishing.eml"), path.join(dir, "a.eml"));
    copyFileSync(path.join(samples, "demo-legitimate.eml"), path.join(dir, "nested", "b.EML"));
    writeFileSync(path.join(dir, "notes.txt"), "not an email");
    return dir;
}

describe("mxlens CLI", () => {
    it("prints a readable report for one file", async () => {
        const t = makeIo();
        const code = await run([path.join(samples, "demo-phishing.eml")], t.io);

        expect(code).toBe(0);
        expect(t.stdout()).toContain("HIGH RISK");
        expect(t.stdout()).toContain("DMARC fail");
    });

    it("emits a JSON object for one input and an array for several", async () => {
        const one = makeIo();
        await run(["--json", path.join(samples, "demo-phishing.eml")], one.io);
        expect(JSON.parse(one.stdout())).toMatchObject({ verdict: "malicious" });

        const many = makeIo();
        await run(["analyze", "--json", inbox()], many.io);
        const rows = JSON.parse(many.stdout());
        expect(rows).toHaveLength(2);
        expect(rows.map((r: { input: string }) => path.basename(r.input))).toEqual(["a.eml", "b.EML"]);
    });

    it("reads from stdin", async () => {
        const t = makeIo(readFileSync(path.join(samples, "demo-phishing.eml"), "utf8"));
        expect(await run(["-", "--json"], t.io)).toBe(0);
        expect(JSON.parse(t.stdout()).input).toBe("-");
    });

    it("returns 2 when --fail-on is met and 0 when it is not", async () => {
        expect(await run(["--fail-on", "malicious", path.join(samples, "demo-phishing.eml")], makeIo().io)).toBe(2);
        expect(await run(["--fail-on", "malicious", path.join(samples, "demo-legitimate.eml")], makeIo().io)).toBe(0);
    });

    it("returns 1 for usage and read errors", async () => {
        const missing = makeIo();
        expect(await run(["does-not-exist.eml"], missing.io)).toBe(1);
        expect(missing.stderr()).toContain("no such file");

        expect(await run(["--fail-on", "nope", "x.eml"], makeIo().io)).toBe(1);
        expect(await run([], makeIo().io)).toBe(1);
        expect(await run(["--unknown-flag"], makeIo().io)).toBe(1);
    });
});
