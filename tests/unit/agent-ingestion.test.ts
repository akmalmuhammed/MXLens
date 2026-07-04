import { describe, expect, it } from "vitest";
import { AgentApiError } from "@/lib/agent-api/errors";
import { isPrivateIpAddress, validateFetchUrl } from "@/lib/agent-api/ingestion";

describe("agent ingestion guardrails", () => {
    it("blocks private and loopback IP addresses", () => {
        expect(isPrivateIpAddress("127.0.0.1")).toBe(true);
        expect(isPrivateIpAddress("10.0.0.5")).toBe(true);
        expect(isPrivateIpAddress("172.16.4.2")).toBe(true);
        expect(isPrivateIpAddress("192.168.1.20")).toBe(true);
        expect(isPrivateIpAddress("::1")).toBe(true);
        expect(isPrivateIpAddress("8.8.8.8")).toBe(false);
    });

    it("requires HTTPS fetch URLs without embedded credentials", () => {
        expect(() => validateFetchUrl("http://example.com/message.eml")).toThrow(AgentApiError);
        expect(() => validateFetchUrl("https://user:pass@example.com/message.eml")).toThrow(AgentApiError);

        const url = validateFetchUrl("https://storage.example.com/message.eml?signature=test");
        expect(url.hostname).toBe("storage.example.com");
    });

    it("blocks literal private fetch URL hosts before DNS lookup", () => {
        expect(() => validateFetchUrl("https://127.0.0.1/message.eml")).toThrow(AgentApiError);
        expect(() => validateFetchUrl("https://[::1]/message.eml")).toThrow(AgentApiError);
    });
});
