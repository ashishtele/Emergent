import { describe, it, expect, vi, afterEach } from "vitest";
import { findCodeRepos } from "../lib/github";

afterEach(() => vi.unstubAllGlobals());

const ITEMS = {
  total_count: 2,
  items: [
    {
      full_name: "a/transformer",
      html_url: "https://github.com/a/transformer",
      stargazers_count: 5000,
      description: "x",
    },
    { full_name: "b/fork", html_url: "https://github.com/b/fork", stargazers_count: 10, description: "y" },
  ],
};

describe("findCodeRepos (GitHub)", () => {
  it("prefers exact arXiv-id matches sorted by stars", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ITEMS })),
    );
    const out = await findCodeRepos({ arxivId: "1706.03762" });
    expect(out).toHaveLength(2);
    expect(out[0].stars).toBe(5000);
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain("1706.03762");
  });
  it("falls back to title keywords when no arxiv id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ total_count: 0, items: [] }) })),
    );
    expect(await findCodeRepos({ title: "Attention Is All You Need" })).toEqual([]);
    const url = String(vi.mocked(fetch).mock.calls[0][0]);
    expect(url.toLowerCase()).toContain("attention");
  });
  it("returns [] on rate-limit/failure instead of throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 403 })),
    );
    expect(await findCodeRepos({ arxivId: "1.2" })).toEqual([]);
  });
});
