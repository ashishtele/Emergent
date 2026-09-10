import { describe, it, expect } from "vitest";
import { growthPct, rankTrending, yearCounts } from "../lib/trends";

describe("growthPct (PRD section 11)", () => {
  it("computes (cur - prev) / prev * 100", () => {
    expect(growthPct(100, 150)).toBe(50);
    expect(growthPct(49706, 92489)).toBeCloseTo(86.1, 1);
  });
  it("returns 0 when there is no baseline", () => {
    expect(growthPct(0, 100)).toBe(0);
  });
});

describe("rankTrending", () => {
  it("attaches growth and sorts descending", () => {
    const out = rankTrending([
      { term: "slow", prev: 100, cur: 110 },
      { term: "fast", prev: 100, cur: 200 },
    ]);
    expect(out.map((t) => t.term)).toEqual(["fast", "slow"]);
    expect(out[0].growth_pct).toBe(100);
  });
});

describe("yearCounts", () => {
  it("maps group_by entries by numeric year", () => {
    const m = yearCounts([{ key: "2024", count: 5 }]);
    expect(m.get(2024)).toBe(5);
  });
});
