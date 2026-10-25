"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function TermsMarquee() {
  const [terms, setTerms] = useState<string[]>([]);
  useEffect(() => {
    fetch("/api/topics/trending")
      .then((r) => r.json())
      .then((d) => setTerms((d.trending ?? []).map((t: any) => t.term)))
      .catch(() => {});
  }, []);
  if (terms.length === 0) return null;
  const row = [...terms, ...terms];
  return (
    <nav
      aria-label="Trending research topics"
      className="overflow-hidden border-y border-ink/10 py-3 dark:border-white/10"
    >
      <div className="marquee-track flex w-max gap-8 whitespace-nowrap font-display text-lg font-bold text-ink/60 dark:text-paper/60">
        {row.map((t, i) =>
          i >= terms.length ? (
            <span key={i} aria-hidden="true">
              #{t.replace(/\s+/g, "")}
            </span>
          ) : (
            <Link key={i} href={`/search?q=${encodeURIComponent(t)}`} className="hover:text-accent-ink">
              #{t.replace(/\s+/g, "")}
            </Link>
          ),
        )}
      </div>
    </nav>
  );
}
