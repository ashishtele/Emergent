import { describe, it, expect, vi, afterEach } from "vitest";
import { getTopicSummary } from "../lib/wiki";

afterEach(() => vi.unstubAllGlobals());

describe("getTopicSummary (Wikipedia)", () => {
  it("returns the extract for a matching article", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: any) => ({
        ok: true,
        json: async () => ({ type: "standard", extract: "Machine learning is a field." }),
      })),
    );
    expect(await getTopicSummary("Machine learning")).toBe("Machine learning is a field.");
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain("page/summary/Machine%20learning");
  });
  it("returns null for disambiguation pages and failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ type: "disambiguation" }) })),
    );
    expect(await getTopicSummary("AI")).toBeNull();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 404 })),
    );
    expect(await getTopicSummary("Xyzzy")).toBeNull();
  });
});
