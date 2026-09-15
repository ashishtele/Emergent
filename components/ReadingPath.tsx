"use client";
import { useState } from "react";
import Link from "next/link";
import CiteChip from "./CiteChip";

interface Step {
  openalexId: string;
  title?: string;
  year?: string;
  cited_by_count?: number;
  why: string;
}

export default function ReadingPath({ topic, topicId }: { topic: string; topicId?: string }) {
  const [path, setPath] = useState<Step[] | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    setMsg("Asking AI…");
    const res = await fetch("/api/ai/reading-path", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, topicId }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(j.error ?? "Failed — sign in first.");
      return;
    }
    setPath(j.path);
    setMsg(j.cached ? "From cache ✓" : "Fresh from AI ✓");
  };

  return (
    <div className="card">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">📚 AI reading path</div>
        <button
          onClick={generate}
          disabled={busy}
          className="btn-primary !px-4 !py-1.5 text-sm disabled:opacity-50"
        >
          {busy ? "…" : "Generate"}
        </button>
      </div>
      {msg && <p className="mb-2 text-xs text-ink/50 dark:text-paper/50">{msg}</p>}
      {path && (
        <ol className="space-y-3 text-sm">
          {path.map((s, i) => (
            <li key={s.openalexId} className="relative flex gap-3">
              <div className="flex flex-col items-center">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs font-bold text-paper dark:bg-paper dark:text-ink">
                  {i + 1}
                </span>
                {i < path.length - 1 && <span className="w-px flex-1 bg-ink/20 dark:bg-paper/20" />}
              </div>
              <div className="pb-1">
                <Link
                  href={`/papers/${encodeURIComponent(s.openalexId)}`}
                  className="font-medium hover:underline"
                >
                  {s.title ?? s.openalexId}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <CiteChip openalexId={s.openalexId} />
                  {s.year && <CiteChip label={s.year} title="publication year" />}
                  {typeof s.cited_by_count === "number" && (
                    <CiteChip label={`cited ×${s.cited_by_count}`} title="citation count" />
                  )}
                </div>
                <div className="mt-1 text-xs text-ink/60 dark:text-paper/60">{s.why}</div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
