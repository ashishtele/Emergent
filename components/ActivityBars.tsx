"use client";
import { useEffect, useRef, useState } from "react";

export default function ActivityBars({ activity }: { activity: { year: number; count: number }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setGrown(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const max = Math.max(...activity.map((a) => a.count));
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4">
      <div className="mb-2 text-sm font-semibold">Research activity</div>
      <div ref={ref} className="flex items-end gap-1.5">
        {activity.map((a) => (
          <div
            key={a.year}
            title={`${a.year}: ${a.count.toLocaleString()} papers`}
            className="bar-grow w-8 rounded-t bg-ink/80 hover:bg-accent"
            style={{ height: grown ? `${Math.max(4, (a.count / max) * 96)}px` : "4px" }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5 text-[10px] text-ink/40">
        {activity.map((a) => (
          <span key={a.year} className="w-8">
            {String(a.year).slice(2)}
          </span>
        ))}
      </div>
    </div>
  );
}
