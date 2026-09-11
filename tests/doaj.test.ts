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
  it("falls back to a shorter query when the full one is empty", async () => {
    const full = { ok: true, json: async () => ({ results: [] }) };
    const short = {
      ok: true,
      json: async () => ({
        results: [{ bibjson: { title: "Mil J", publisher: { name: "P" }, ref: { journal: "https://m.j" } } }],
      }),
    };
    const mock = vi.fn();
    mock.mockResolvedValueOnce(full).mockResolvedValueOnce(short);
    vi.stubGlobal("fetch", mock);
    const out = await getJournals("military technology strategies");
    expect(out).toEqual([{ title: "Mil J", publisher: "P", link: "https://m.j" }]);
    const calls = mock.mock.calls.map((c) => String(c[0]));
    expect(calls).toHaveLength(2);
    expect(calls[1]).toContain("military%20technology");
  });
});
