"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getTrending, type TrendingPayload } from "@/lib/trending-client";

export default function Trending() {
  const [data, setData] = useState<TrendingPayload | null>(null);
  useEffect(() => {
    let alive = true;
    getTrending().then((d) => {
      if (alive) setData(d);
    });
    return () => {
      alive = false;
    };
  }, []);
  if (!data) return <p className="text-sm text-ink/60 dark:text-paper/60">Loading trends…</p>;
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {(data.trending ?? []).map((t) => (
        <Link
          key={t.term}
          href={`/search?q=${encodeURIComponent(t.term)}`}
          className="chip-hot"
          title={`${t.prev?.toLocaleString()} → ${t.cur?.toLocaleString()} papers`}
        >
          {t.term} <span className="opacity-70">+{t.growth_pct}%</span>
        </Link>
      ))}
    </div>
  );
}
