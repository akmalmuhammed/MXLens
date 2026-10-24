import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));

import { mapWithConcurrency } from "@/lib/agent-api/batch-processor";

describe("mapWithConcurrency", () => {
    it("keeps output order while respecting the configured concurrency", async () => {
        let active = 0;
        let peak = 0;

        const results = await mapWithConcurrency(["a", "b", "c", "d", "e"], 2, async (value, index) => {
            active += 1;
            peak = Math.max(peak, active);
            await new Promise((resolve) => setTimeout(resolve, index % 2 === 0 ? 8 : 2));
            active -= 1;
            return `${index}:${value}`;
        });

        expect(peak).toBeLessThanOrEqual(2);
        expect(results).toEqual(["0:a", "1:b", "2:c", "3:d", "4:e"]);
    });
});
