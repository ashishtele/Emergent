"use client";
import { useEffect, useState } from "react";
import CountUp from "./CountUp";

export default function StatsStrip() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/topics/trending")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);
  const top = data?.trending?.[0];
  const stats = [
    { value: data ? data.trending.length : 0, suffix: "", label: "fields tracked live", decimals: 0 },
    {
      value: top ? top.growth_pct : 0,
      prefix: "+",
      suffix: "%",
      label: `${top ? top.term : "fastest"} growth`,
      decimals: 1,
    },
    { value: top ? top.cur / 1000 : 0, suffix: "K", label: "papers in top field", decimals: 0 },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="card min-w-0 overflow-hidden text-center">
          <div className="whitespace-nowrap font-display text-2xl font-black text-accent md:text-3xl">
            <CountUp to={s.value} prefix={s.prefix ?? ""} suffix={s.suffix} decimals={s.decimals} />
          </div>
          <div className="mt-1 truncate text-xs text-ink/50 dark:text-paper/50">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
