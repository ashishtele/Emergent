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
  const summary = activity.map((a) => `${a.year}: ${a.count.toLocaleString()}`).join(", ");
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4 dark:border-white/10 dark:bg-soot">
      <div className="mb-2 text-sm font-semibold">Research activity</div>
      <div
        ref={ref}
        role="img"
        aria-label={`Research activity by year. ${summary}`}
        className="flex h-24 items-end gap-1.5"
      >
        {activity.map((a) => (
          <div
            key={a.year}
            aria-hidden="true"
            title={`${a.year}: ${a.count.toLocaleString()} papers`}
            className="bar-grow h-full min-w-0 flex-1 origin-bottom rounded-t bg-ink/80 hover:bg-accent dark:bg-paper/70 dark:hover:bg-accent"
            style={{ transform: `scaleY(${grown ? Math.max(0.04, a.count / max) : 0.04})` }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5 text-[10px] text-ink/60 dark:text-paper/60">
        {activity.map((a) => (
          <span key={a.year} className="min-w-0 flex-1 truncate text-center">
            {String(a.year).slice(2)}
          </span>
        ))}
      </div>
    </div>
  );
}
