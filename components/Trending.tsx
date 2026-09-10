"use client";
import { useEffect, useState } from "react";

export default function Trending() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/topics/trending")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);
  if (!data) return <p className="text-sm text-zinc-500">Loading trends…</p>;
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {(data.trending ?? []).map((t: any) => (
        <a
          key={t.term}
          href={`/search?q=${encodeURIComponent(t.term)}`}
          className="rounded-full bg-black px-3 py-1 text-white"
          title={`${t.prev} → ${t.cur} papers`}
        >
          {t.term} +{t.growth_pct}%
        </a>
      ))}
    </div>
  );
}
