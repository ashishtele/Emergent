export interface TrendingTerm {
  term: string;
  prev: number;
  cur: number;
  growth_pct: number;
}

export interface TrendingPayload {
  trending: TrendingTerm[];
}

let pending: Promise<TrendingPayload> | null = null;

export function getTrending(): Promise<TrendingPayload> {
  if (!pending) {
    pending = fetch("/api/topics/trending")
      .then((r) => (r.ok ? r.json() : { trending: [] }))
      .catch(() => {
        pending = null;
        return { trending: [] };
      });
  }
  return pending;
}
