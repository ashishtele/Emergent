import { describe, it, expect, vi, afterEach } from "vitest";
import { openAlex } from "../lib/openalex";

afterEach(() => vi.unstubAllGlobals());

describe("openAlex client", () => {
  it("builds URL with params and returns JSON", async () => {
    const json = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json })),
    );
    const out = await openAlex("/works", { search: "ai" });
    expect(out).toEqual({ ok: true });
    const url = String(vi.mocked(fetch).mock.calls[0][0]);
    expect(url).toContain("https://api.openalex.org/works?");
    expect(url).toContain("search=ai");
  });
  it("throws with status on API failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500 })),
    );
    await expect(openAlex("/works")).rejects.toThrow("OpenAlex 500");
  });
  it("passes a timeout signal so slow upstreams cannot hang", async () => {
    const fakeFetch = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
    vi.stubGlobal("fetch", fakeFetch);
    await openAlex("/works", {}, 1234);
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});
