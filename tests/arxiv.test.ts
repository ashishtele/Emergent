import { describe, it, expect, vi, afterEach } from "vitest";
import { getFreshPreprints, topicKeywords } from "../lib/arxiv";

afterEach(() => vi.unstubAllGlobals());

const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
<entry><id>http://arxiv.org/abs/2401.00001v1</id><title>First preprint</title><published>2024-01-01T00:00:00Z</published></entry>
<entry><id>http://arxiv.org/abs/2401.00002v1</id><title>Second preprint</title><published>2024-01-02T00:00:00Z</published></entry>
</feed>`;

describe("getFreshPreprints (arXiv)", () => {
  it("parses ATOM entries into id/title/link", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, text: async () => FEED })),
    );
    const out = await getFreshPreprints("quantum");
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ id: "2401.00001", title: "First preprint" });
    expect(out[0].link).toContain("arxiv.org/abs/2401.00001");
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain("export.arxiv.org/api/query");
  });
  it("returns [] on failure instead of throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500 })),
    );
    expect(await getFreshPreprints("quantum")).toEqual([]);
  });
});

describe("topicKeywords", () => {
  it("drops stopwords and keeps the distinctive core", () => {
    expect(topicKeywords("AI in Healthcare and Education")).toBe("healthcare education");
    expect(topicKeywords("Machine learning")).toBe("machine learning");
  });
  it("falls back to a shorter query when the full one is empty", async () => {
    const empty = { ok: true, text: async () => "<feed></feed>" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => empty),
    );
    expect(await getFreshPreprints("Artificial Intelligence in Healthcare and Education")).toEqual([]);
    const calls = vi.mocked(fetch).mock.calls.map((c) => String(c[0]));
    expect(calls.length).toBe(2);
    expect(calls[0]).toContain("artificial+intelligence+healthcare");
    expect(calls[1]).toContain("artificial+intelligence");
    expect(calls[1]).not.toContain("healthcare");
  });
});
