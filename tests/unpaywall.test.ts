import { describe, it, expect, vi, afterEach } from "vitest";
import { getOaLocations } from "../lib/unpaywall";

afterEach(() => vi.unstubAllGlobals());

describe("getOaLocations (Unpaywall)", () => {
  it("returns pdf and landing urls for OA works", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: any) => ({
        ok: true,
        json: async () => ({
          is_oa: true,
          best_oa_location: { url_for_pdf: "https://x/y.pdf", url: "https://x/y" },
        }),
      })),
    );
    const out = await getOaLocations("10.1234/x", "me@example.com");
    expect(out).toEqual({ pdfUrl: "https://x/y.pdf", landingUrl: "https://x/y" });
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain("api.unpaywall.org/v2/10.1234/x");
  });
  it("returns null for closed works and on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ is_oa: false }) })),
    );
    expect(await getOaLocations("10.1/x", "e@x.com")).toBeNull();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500 })),
    );
    expect(await getOaLocations("10.1/x", "e@x.com")).toBeNull();
  });
});
