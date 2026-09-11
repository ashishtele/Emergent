import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchFullText, briefPrompt, briefCacheKey } from "../lib/jina";

afterEach(() => vi.unstubAllGlobals());

describe("fetchFullText (Jina Reader)", () => {
  it("returns trimmed markdown for good responses", async () => {
    const body = "# Title\n\n" + "Body text here. ".repeat(40);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: any, init: any) => ({ ok: true, text: async () => `  ${body}  ` })),
    );
    const out = await fetchFullText("https://example.com/paper.pdf");
    expect(out).toBe(body.trim());
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain("r.jina.ai/https://example.com/paper.pdf");
  });
  it("sends the key when configured and rejects thin content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, text: async () => "short" })),
    );
    expect(await fetchFullText("https://x.y/z", "jina-key")).toBeNull();
    const init = vi.mocked(fetch).mock.calls[0][1] as any;
    expect(init.headers.Authorization).toBe("Bearer jina-key");
  });
  it("returns null on paywall/rate-limit/failure", async () => {
    for (const status of [402, 429]) {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({ ok: false, status })),
      );
      expect(await fetchFullText("https://x.y/z")).toBeNull();
    }
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("down");
      }),
    );
    expect(await fetchFullText("https://x.y/z")).toBeNull();
  });
});

describe("briefPrompt/briefCacheKey", () => {
  it("asks for problem/method/result/limitation and keys by url hash", () => {
    const p = briefPrompt("Some Title", "full text here");
    expect(p).toContain("Some Title");
    expect(p).toContain("Limitation");
    expect(briefCacheKey("https://x/y", "m")).toBe(briefCacheKey("https://x/y", "m"));
    expect(briefCacheKey("https://x/y", "m")).not.toBe(briefCacheKey("https://x/z", "m"));
  });
});
