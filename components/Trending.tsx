"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Trending() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/topics/trending")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);
  if (!data) return <p className="text-sm text-ink/40">Loading trends…</p>;
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {(data.trending ?? []).map((t: any) => (
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
