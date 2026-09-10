// Pure helpers for research-trend math (PRD section 11).
// Growth Rate = (current - previous) / previous * 100
export function growthPct(prev: number, cur: number): number {
  if (prev <= 0) return 0;
  return Math.round(((cur - prev) / prev) * 100 * 10) / 10;
}

export interface TrendInput {
  term: string;
  prev: number;
  cur: number;
}

export function rankTrending(items: TrendInput[]) {
  return items
    .map((t) => ({ ...t, growth_pct: growthPct(t.prev, t.cur) }))
    .sort((a, b) => b.growth_pct - a.growth_pct);
}

export function yearCounts(groupBy: { key: string | number; count: number }[]) {
  const m = new Map<number, number>();
  for (const g of groupBy ?? []) m.set(Number(g.key), Number(g.count));
  return m;
}
