import { describe, it, expect, vi } from "vitest";
import {
  compositeScore,
  heuristicRank,
  jevCacheKey,
  isJevConfigured,
  jevModel,
  buildJevQuestions,
  rankPapers,
  toJevPapers,
  reorderByRank,
} from "../lib/jev";
import { rankSchema } from "../lib/validators";

const papers = [
  {
    openalexId: "W1",
    title: "AI agents for science",
    abstract: "agents plan experiments",
    year: "2024",
    cited_by_count: 120,
  },
  { openalexId: "W2", title: "Medieval poetry", abstract: "sonnets", year: "1990", cited_by_count: 5 },
];

describe("compositeScore", () => {
  it("weights relevance highest", () => {
    expect(compositeScore(1, 0, 0)).toBe(0.5);
    expect(compositeScore(0, 3, 3)).toBe(0.5);
    expect(compositeScore(1, 3, 3)).toBe(1);
    expect(compositeScore(0, 0, 0)).toBe(0);
  });
});

describe("hev heuristic", () => {
  it("ranks on-topic highly-cited first, deterministic", () => {
    const a = heuristicRank("AI agents", papers);
    expect(a[0].openalexId).toBe("W1");
    expect(a[0].composite).toBeGreaterThan(a[1].composite);
    expect(heuristicRank("AI agents", papers)).toEqual(a);
  });
});

describe("jev config", () => {
  it("is false without key, honours kill-switch", () => {
    const prevKey = process.env.TYPESAFE_API_KEY;
    const prevFlag = process.env.JEV_ENABLED;
    delete process.env.TYPESAFE_API_KEY;
    delete process.env.JEV_ENABLED;
    expect(isJevConfigured()).toBe(false);
    process.env.TYPESAFE_API_KEY = "k";
    process.env.JEV_ENABLED = "false";
    expect(isJevConfigured()).toBe(false);
    process.env.JEV_ENABLED = "true";
    expect(isJevConfigured()).toBe(true);
    expect(jevModel()).toBe("jev-latest");
    if (prevKey === undefined) delete process.env.TYPESAFE_API_KEY;
    else process.env.TYPESAFE_API_KEY = prevKey;
    if (prevFlag === undefined) delete process.env.JEV_ENABLED;
    else process.env.JEV_ENABLED = prevFlag;
  });
  it("cache key is case-insensitive and model-scoped", () => {
    expect(jevCacheKey(" AI ", "m1")).toBe(jevCacheKey("ai", "m1"));
    expect(jevCacheKey("ai", "m1")).not.toBe(jevCacheKey("ai", "m2"));
  });
  it("builds 4 parallel questions", () => {
    const q = buildJevQuestions("agents") as Record<string, { type: string }>;
    expect(q.relevance.type).toBe("noul");
    expect(q.emergence.type).toBe("score");
    expect(q.rigor.type).toBe("score");
    expect(q.level.type).toBe("choice");
  });
});

describe("rankPapers fallback", () => {
  it("uses heuristic when no key — never throws", async () => {
    const prevKey = process.env.TYPESAFE_API_KEY;
    delete process.env.TYPESAFE_API_KEY;
    try {
      const { source, ranked } = await rankPapers("AI agents", papers);
      expect(source).toBe("heuristic");
      expect(ranked[0].openalexId).toBe("W1");
    } finally {
      if (prevKey !== undefined) process.env.TYPESAFE_API_KEY = prevKey;
    }
  });
});

describe("rankSchema", () => {
  it("rejects empty and oversized payloads", () => {
    expect(rankSchema.safeParse({ query: "", papers }).success).toBe(false);
    expect(rankSchema.safeParse({ query: "ai", papers: [] }).success).toBe(false);
    expect(rankSchema.safeParse({ query: "ai", papers }).success).toBe(true);
  });
});

describe("toJevPapers/reorderByRank", () => {
  it("maps OpenAlex works and reorders by rank", () => {
    const works = [
      {
        id: "https://openalex.org/W2",
        title: "B",
        abstract_inverted_index: { hello: [0] },
        publication_year: 1990,
        cited_by_count: 1,
      },
      {
        id: "https://openalex.org/W1",
        title: "A",
        abstract_inverted_index: { hello: [0] },
        publication_year: 2024,
        cited_by_count: 50,
      },
    ];
    const inputs = toJevPapers(works);
    expect(inputs.map((p) => p.openalexId)).toEqual(["W2", "W1"]);
    expect(inputs[0].abstract).toContain("hello");
    const reordered = reorderByRank(works, [{ openalexId: "W1" }, { openalexId: "W2" }]);
    expect(String((reordered[0] as any).id)).toContain("W1");
  });
  it("handles sparse OpenAlex records and rank leftovers", () => {
    const works = [
      { id: "https://openalex.org/w10", display_name: "No year, no cites" },
      { id: "https://openalex.org/W11", title: "Dated", publication_date: "2021-05-01", cited_by_count: "7" },
      { id: "https://openalex.org/W12", title: "Year field", year: "2019", cited_by_count: 3 },
    ];
    const inputs = toJevPapers(works as any);
    expect(inputs[0].openalexId).toBe("w10");
    expect(inputs[0].year).toBeUndefined();
    expect(inputs[0].cited_by_count).toBeUndefined();
    expect(inputs[1].year).toBe("2021");
    expect(inputs[1].cited_by_count).toBeUndefined();
    expect(inputs[2].year).toBe("2019");
    expect(toJevPapers([])).toEqual([]);
    // unknown + lowercase ids are tolerated; unranked leftovers keep order
    const reordered = reorderByRank(works as any, [{ openalexId: "w12" }, { openalexId: "W999" }]);
    expect(String((reordered[0] as any).id)).toContain("W12");
    expect(reordered).toHaveLength(3);
    expect(reorderByRank(works as any, [])).toHaveLength(3);
  });
});

describe("compositeScore clamping", () => {
  it("clamps out-of-range inputs", () => {
    expect(compositeScore(-2, 99, -1)).toBe(0.3);
    expect(compositeScore(2, -5, 99)).toBe(0.7);
  });
});

describe("heuristicRank edges", () => {
  it("handles empty query and sparse papers", () => {
    const ranked = heuristicRank("!!!", [{ openalexId: "W1", title: "" }]);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].relevance).toBeGreaterThanOrEqual(0);
    const noYear = heuristicRank("ai", [{ openalexId: "W2", title: "ai overview" }]);
    expect(noYear[0].level).toBe("foundational");
  });
});

describe("rankPapers guards", () => {
  it("returns empty heuristic for empty input and honours kill-switch", async () => {
    const prevKey = process.env.TYPESAFE_API_KEY;
    const prevFlag = process.env.JEV_ENABLED;
    const prevModel = process.env.JEV_MODEL;
    process.env.TYPESAFE_API_KEY = "k";
    process.env.JEV_ENABLED = "false";
    try {
      expect((await rankPapers("ai", [])).ranked).toEqual([]);
      const { source } = await rankPapers("ai", papers);
      expect(source).toBe("heuristic");
      process.env.JEV_MODEL = "jev-test";
      expect(jevModel()).toBe("jev-test");
    } finally {
      if (prevKey === undefined) delete process.env.TYPESAFE_API_KEY;
      else process.env.TYPESAFE_API_KEY = prevKey;
      if (prevFlag === undefined) delete process.env.JEV_ENABLED;
      else process.env.JEV_ENABLED = prevFlag;
      if (prevModel === undefined) delete process.env.JEV_MODEL;
      else process.env.JEV_MODEL = prevModel;
    }
  });
});

const jevCtl = vi.hoisted(() => ({ mode: "ok" as "ok" | "fail", calls: 0 }));

vi.mock("@typesafe-ai/sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@typesafe-ai/sdk")>();
  class FakeClient {
    constructor(..._args: unknown[]) {}
    async systemOne(_req: unknown) {
      jevCtl.calls += 1;
      if (jevCtl.mode === "fail") throw new Error("jev-down");
      const first = jevCtl.calls === 1;
      return {
        model: "jev-latest",
        answers: {
          relevance: { type: "noul", noul: first ? 0.9 : 0.2 },
          emergence: { type: "score", score: first ? 3 : 0, confidence: 0.8 },
          rigor: { type: "score", score: 2, confidence: 0.7 },
          level: {
            type: "choice",
            choice: first ? "cutting_edge" : "exclude",
            confidence: 0.9,
            probabilities: {},
          },
        },
        usage: { input_tokens: 10, output_tokens: 0 },
      };
    }
  }
  return { ...actual, TypeSafeClient: FakeClient };
});

describe("rankPapers live (mocked Jev)", () => {
  it("uses Jev scores, drops excludes, sorts by composite", async () => {
    const prevKey = process.env.TYPESAFE_API_KEY;
    const prevFlag = process.env.JEV_ENABLED;
    process.env.TYPESAFE_API_KEY = "test-key";
    delete process.env.JEV_ENABLED;
    jevCtl.mode = "ok";
    jevCtl.calls = 0;
    try {
      const { source, ranked } = await rankPapers("AI agents", papers);
      expect(source).toBe("jev");
      expect(ranked).toHaveLength(1);
      expect(ranked[0].openalexId).toBe("W1");
      expect(ranked[0].relevance).toBe(0.9);
      expect(ranked[0].composite).toBeCloseTo(0.5 * 0.9 + 0.3 * 1 + 0.2 * (2 / 3), 3);
      expect(ranked[0].confidence).toBeCloseTo(0.85, 3);
    } finally {
      if (prevKey === undefined) delete process.env.TYPESAFE_API_KEY;
      else process.env.TYPESAFE_API_KEY = prevKey;
      if (prevFlag === undefined) delete process.env.JEV_ENABLED;
      else process.env.JEV_ENABLED = prevFlag;
    }
  });
  it("falls back to heuristic when Jev fails", async () => {
    const prevKey = process.env.TYPESAFE_API_KEY;
    process.env.TYPESAFE_API_KEY = "test-key";
    delete process.env.JEV_ENABLED;
    jevCtl.mode = "fail";
    try {
      const { source, ranked } = await rankPapers("AI agents", papers);
      expect(source).toBe("heuristic");
      expect(ranked[0].openalexId).toBe("W1");
    } finally {
      jevCtl.mode = "ok";
      if (prevKey === undefined) delete process.env.TYPESAFE_API_KEY;
      else process.env.TYPESAFE_API_KEY = prevKey;
    }
  });
});
