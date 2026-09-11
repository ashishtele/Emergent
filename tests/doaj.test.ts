import { describe, it, expect, vi, afterEach } from "vitest";
import { getJournals } from "../lib/doaj";

afterEach(() => vi.unstubAllGlobals());

describe("getJournals (DOAJ)", () => {
  it("returns title, publisher and link", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: any) => ({
        ok: true,
        json: async () => ({
          results: [
            {
              bibjson: {
                title: "JMLR",
                publisher: { name: "MIT Press" },
                ref: { journal: "https://jmlr.org" },
              },
            },
          ],
        }),
      })),
    );
    const out = await getJournals("machine learning");
    expect(out).toEqual([{ title: "JMLR", publisher: "MIT Press", link: "https://jmlr.org" }]);
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain("doaj.org/api/search/journals/");
  });
  it("returns [] on failure or empty results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ results: [] }) })),
    );
    expect(await getJournals("xyzzy")).toEqual([]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500 })),
    );
    expect(await getJournals("ml")).toEqual([]);
  });
});
