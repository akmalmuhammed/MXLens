/**
 * Runs the engine over the labeled corpus and prints an accuracy report:
 * per-message outcome, a confusion matrix, precision/recall/F1 and per-technique
 * recall. Exits non-zero when accuracy falls below the gate, so CI fails on a
 * regression. A message counts as "detected" when its verdict is not "clean".
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { analyzeEmail } from "../src/index.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "corpus");
const GATE = { recall: 0.9, falsePositiveRate: 0.1 };
const now = new Date("2026-06-01T00:00:00Z");

interface Entry { file: string; label: "phishing" | "legitimate"; techniques?: string[] }
const labels: { messages: Entry[] } = JSON.parse(readFileSync(join(root, "labels.json"), "utf8"));

let tp = 0, fn = 0, tn = 0, fp = 0;
const misses: string[] = [];
const falsePositives: string[] = [];
const byTechnique = new Map<string, { total: number; caught: number }>();
const rows: string[] = [];

for (const entry of labels.messages) {
    const path = join(root, entry.file);
    if (!existsSync(path)) throw new Error(`Missing corpus file: ${entry.file}`);
    const result = await analyzeEmail(readFileSync(path), { now });
    const flagged = result.verdict !== "clean";
    const correct = flagged === (entry.label === "phishing");
    if (entry.label === "phishing") {
        if (flagged) tp++; else { fn++; misses.push(entry.file); }
        for (const t of entry.techniques ?? []) {
            const rec = byTechnique.get(t) ?? { total: 0, caught: 0 };
            rec.total++; if (flagged) rec.caught++;
            byTechnique.set(t, rec);
        }
    } else {
        if (flagged) { fp++; falsePositives.push(entry.file); } else tn++;
    }
    rows.push(`  ${correct ? "ok " : "XX "} ${entry.label.padEnd(10)} ${entry.file.split("/").pop()!.padEnd(36)} ${result.verdictLabel.padEnd(22)} risk ${String(result.riskScore).padStart(3)}`);
}

const recall = tp / (tp + fn || 1);
const precision = tp / (tp + fp || 1);
const f1 = (2 * precision * recall) / (precision + recall || 1);
const fpr = fp / (fp + tn || 1);

console.log("MXLens accuracy report\n");
console.log(rows.join("\n"));
console.log("\nConfusion matrix (detected = verdict is not \"clean\")");
console.log("                 predicted phishing   predicted clean");
console.log(`  actual phishing        ${String(tp).padStart(3)}                ${String(fn).padStart(3)}`);
console.log(`  actual legitimate      ${String(fp).padStart(3)}                ${String(tn).padStart(3)}`);
console.log(`\n  Messages          ${labels.messages.length}`);
console.log(`  Recall            ${(recall * 100).toFixed(1)}%  (caught ${tp}/${tp + fn} phishing)`);
console.log(`  Precision         ${(precision * 100).toFixed(1)}%`);
console.log(`  F1 score          ${(f1 * 100).toFixed(1)}%`);
console.log(`  False positives   ${(fpr * 100).toFixed(1)}%  (${fp}/${fp + tn} legitimate flagged)`);
if (misses.length) console.log(`\n  Missed phishing:   ${misses.join(", ")}`);
if (falsePositives.length) console.log(`  False positives:   ${falsePositives.join(", ")}`);

console.log("\nPer-technique recall");
for (const [t, rec] of [...byTechnique].sort()) {
    console.log(`  ${t.padEnd(22)} ${rec.caught}/${rec.total}`);
}

const failures: string[] = [];
if (recall < GATE.recall) failures.push(`recall ${(recall * 100).toFixed(1)}% < ${(GATE.recall * 100)}%`);
if (fpr > GATE.falsePositiveRate) failures.push(`false-positive rate ${(fpr * 100).toFixed(1)}% > ${(GATE.falsePositiveRate * 100)}%`);
if (failures.length) {
    console.error(`\nFAIL: ${failures.join("; ")}`);
    process.exit(1);
}
console.log("\nPASS: accuracy gate met.");
