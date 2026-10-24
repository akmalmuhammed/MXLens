import { describe, expect, it } from "vitest";
import { isKnownAuthServ } from "@/lib/email/scoring/Config";

describe("isKnownAuthServ", () => {
    it("accepts provider domains and their subdomains", () => {
        expect(isKnownAuthServ("mx.google.com")).toBe(true);
        expect(isKnownAuthServ("BN8NAM12.prod.protection.outlook.com")).toBe(true);
        expect(isKnownAuthServ("mx0a-001.pphosted.proofpoint.com.")).toBe(true);
        expect(isKnownAuthServ("esa1.ironport-cloud.example")).toBe(true);
    });

    it("rejects lookalikes that only contain a provider name", () => {
        expect(isKnownAuthServ("google.com.attacker.example")).toBe(false);
        expect(isKnownAuthServ("notgoogle.com")).toBe(false);
        expect(isKnownAuthServ("mx.example.org")).toBe(false);
    });
});
