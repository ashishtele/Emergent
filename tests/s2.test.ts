import { describe, it, expect, vi, afterEach } from "vitest";
import { getPaperEnrichment } from "../lib/s2";

afterEach(() => vi.unstubAllGlobals());

describe("getPaperEnrichment (Semantic Scholar)", () => {
  it("returns tldr and influential cites by DOI", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: any) => ({
        ok: true,
        json: async () => ({
          title: "T",
          tldr: { text: "One-line summary." },
          citationCount: 10,
          influentialCitationCount: 3,
        }),
      })),
    );
    const out = await getPaperEnrichment("10.1234/x", "key");
    expect(out?.tldr).toBe("One-line summary.");
    expect(out?.influentialCites).toBe(3);
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain("DOI:10.1234/x");
  });
  it("returns null when the paper has no TLDR", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({}) })),
    );
    expect(await getPaperEnrichment("10.1234/x")).toBeNull();
  });
  it("returns null on API failure instead of throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 429 })),
    );
    expect(await getPaperEnrichment("10.1234/x")).toBeNull();
  });
});
