import { describe, it, expect } from "vitest";
import { parseCacheKey, previewResponse } from "../lib/history";

describe("parseCacheKey", () => {
  it("parses reading-path keys", () => {
    expect(parseCacheKey("reading-path:v1:m1:rag")).toEqual({
      kind: "reading-path",
      model: "m1",
      label: "rag",
    });
  });
  it("parses brief keys with hashed urls", () => {
    const p = parseCacheKey("brief:v1:m1:abc123");
    expect(p.kind).toBe("brief");
    expect(p.model).toBe("m1");
    expect(p.label).toContain("abc123");
  });
  it("falls back to unknown", () => {
    expect(parseCacheKey("zzz").kind).toBe("unknown");
  });
});

describe("previewResponse", () => {
  it("previews paths as title chains", () => {
    const out = previewResponse([
      { openalexId: "W1", title: "A" },
      { openalexId: "W2", title: "B" },
    ]);
    expect(out).toContain("A");
    expect(out).toContain("B");
  });
  it("previews brief objects", () => {
    expect(previewResponse({ brief: "hello world" })).toBe("hello world");
  });
});
