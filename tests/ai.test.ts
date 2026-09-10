import { describe, it, expect } from "vitest";
import { readingPathPrompt, parseReadingPath, cacheKey, isAiConfigured, aiConfig, aiClient } from "../lib/ai";

describe("readingPathPrompt", () => {
  it("embeds topic and candidates", () => {
    const p = readingPathPrompt("RAG", [{ openalexId: "W1", title: "T", year: "2020", cited_by_count: 5 }]);
    expect(p).toContain("RAG");
    expect(p).toContain("W1");
    expect(p).toContain("JSON only");
  });
});

describe("parseReadingPath", () => {
  const known = new Set(["W1", "W2"]);
  it("keeps known ids in order, capped at 5", () => {
    const raw = JSON.stringify({
      path: [
        { openalexId: "W1", why: "a" },
        { openalexId: "NOPE", why: "b" },
        { openalexId: "W2", why: "c" },
      ],
    });
    expect(parseReadingPath(raw, known)).toEqual([
      { openalexId: "W1", why: "a" },
      { openalexId: "W2", why: "c" },
    ]);
  });
  it("rejects bad shapes and empty paths", () => {
    expect(() => parseReadingPath("{}", known)).toThrow("bad-ai-shape");
    expect(() => parseReadingPath("not json", known)).toThrow();
    expect(() => parseReadingPath(JSON.stringify({ path: [{ openalexId: "X" }] }), known)).toThrow(
      "bad-ai-shape",
    );
  });
});

describe("cacheKey", () => {
  it("is case/space-insensitive and model-scoped", () => {
    expect(cacheKey(" RAG ", "m1")).toBe(cacheKey("rag", "m1"));
    expect(cacheKey("rag", "m1")).not.toBe(cacheKey("rag", "m2"));
  });
});

describe("isAiConfigured", () => {
  it("is false without a key", () => {
    expect(isAiConfigured()).toBe(false);
  });
});

describe("aiConfig/aiClient", () => {
  it("defaults to OpenRouter and builds a client without network", () => {
    const prev = process.env.AI_API_KEY;
    process.env.AI_API_KEY = "test-key";
    try {
      expect(aiConfig().baseURL).toContain("openrouter");
      const { client, model } = aiClient();
      expect(client).toBeDefined();
      expect(typeof model).toBe("string");
      expect(isAiConfigured()).toBe(true);
    } finally {
      if (prev === undefined) delete process.env.AI_API_KEY;
      else process.env.AI_API_KEY = prev;
    }
  });
});
