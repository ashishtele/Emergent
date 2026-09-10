"use client";
import { useState } from "react";
import Link from "next/link";

interface Step {
  openalexId: string;
  title?: string;
  year?: string;
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
    <div className="rounded border bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">📚 AI reading path</div>
        <button
          onClick={generate}
          disabled={busy}
          className="rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          {busy ? "…" : "Generate"}
        </button>
      </div>
      {msg && <p className="mb-2 text-xs text-zinc-500">{msg}</p>}
      {path && (
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          {path.map((s) => (
            <li key={s.openalexId}>
              <Link
                href={`/papers/${encodeURIComponent(s.openalexId)}`}
                className="font-medium hover:underline"
              >
                {s.title ?? s.openalexId}
              </Link>
              <div className="text-xs text-zinc-600">{s.why}</div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
