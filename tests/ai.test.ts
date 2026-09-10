import { describe, it, expect } from "vitest";
import {
  readingPathPrompt,
  parseReadingPath,
  cacheKey,
  isAiConfigured,
  aiConfig,
  aiClient,
  classifyAiError,
  chatWithRetry,
  extractJson,
} from "../lib/ai";

describe("readingPathPrompt", () => {
  it("embeds topic and candidates", () => {
    const p = readingPathPrompt("RAG", [{ openalexId: "W1", title: "T", year: "2020", cited_by_count: 5 }]);
    expect(p).toContain("RAG");
    expect(p).toContain("W1");
    expect(p).toContain("single JSON object");
    expect(p).not.toContain('{"path"');
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

describe("extractJson", () => {
  it("strips prose around the JSON block", () => {
    const out = extractJson('We need to pick 5. {"path":[]} Hope this helps.');
    expect(out).toBe('{"path":[]}');
  });
  it("rejects text with no JSON block", () => {
    expect(() => extractJson("just words, no braces")).toThrow("bad-ai-shape");
  });
  it("parses prose-wrapped paths end to end", () => {
    const known = new Set(["W1"]);
    const raw = 'Here you go: {"path":[{"openalexId":"W1","why":"start here"}]} Enjoy!';
    expect(parseReadingPath(raw, known)).toEqual([{ openalexId: "W1", why: "start here" }]);
  });
});

describe("extractJsonBlocks", () => {
  it("prefers the last block when the model echoes instructions first", () => {
    const known = new Set(["W9"]);
    const raw =
      'We must output JSON only: {"path":[{"openalexId":"...","why":"..."}]}. ' +
      'Here is my answer: {"path":[{"openalexId":"W9","why":"the real pick"}]}';
    expect(parseReadingPath(raw, known)).toEqual([{ openalexId: "W9", why: "the real pick" }]);
  });
  it("still rejects echo-only replies with placeholder ids", () => {
    const known = new Set(["W9"]);
    const raw = 'We must output JSON only: {"path":[{"openalexId":"...","why":"..."}]}.';
    expect(() => parseReadingPath(raw, known)).toThrow("bad-ai-shape");
  });
});

describe("normId", () => {
  it("accepts short ids, full URLs and any casing", async () => {
    const { normId } = await import("../lib/ai");
    expect(normId("W123")).toBe("W123");
    expect(normId("https://openalex.org/w123")).toBe("W123");
    expect(normId("https://openalex.org/W123/")).toBe("W123");
    expect(normId("nope")).toBeNull();
    expect(normId(42)).toBeNull();
  });
  it("parses steps with id/reason key variants", () => {
    const known = new Set(["W1"]);
    const raw = JSON.stringify({ path: [{ id: "https://openalex.org/W1", reason: "good" }] });
    expect(parseReadingPath(raw, known)).toEqual([{ openalexId: "W1", why: "good" }]);
  });
});

describe("isAiConfigured", () => {
  it("is false without a key", () => {
    expect(isAiConfigured()).toBe(false);
  });
});

describe("classifyAiError/chatWithRetry", () => {
  it("treats overload statuses as busy", () => {
    for (const s of [429, 502, 503, 529]) expect(classifyAiError({ status: s })).toBe("busy");
    expect(classifyAiError({ status: 401 })).toBe("fatal");
    expect(classifyAiError(new Error("boom"))).toBe("fatal");
  });
  it("retries once on busy then returns", async () => {
    let n = 0;
    const out = await chatWithRetry(() => {
      n += 1;
      if (n === 1) return Promise.reject({ status: 529 });
      return Promise.resolve("ok");
    });
    expect(out).toBe("ok");
    expect(n).toBe(2);
  });
  it("does not retry fatal errors", async () => {
    let n = 0;
    await expect(
      chatWithRetry(() => {
        n += 1;
        return Promise.reject({ status: 401 });
      }),
    ).rejects.toEqual({ status: 401 });
    expect(n).toBe(1);
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
