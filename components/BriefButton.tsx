"use client";
import { useState } from "react";

export default function BriefButton({ openalexId }: { openalexId: string }) {
  const [brief, setBrief] = useState<string | null>(null);
  const [meta, setMeta] = useState("");
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    setMeta("Reading the paper…");
    const res = await fetch("/api/ai/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openalexId }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMeta(j.error ?? "Failed — sign in first.");
      return;
    }
    setBrief(j.brief);
    setMeta(j.cached ? "From cache ✓" : j.fullText ? "From full text ✓" : "From abstract ✓");
  };

  return (
    <div className="card">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">⚡ 2-minute brief</div>
        {!brief && (
          <button
            onClick={generate}
            disabled={busy}
            className="btn-primary !px-4 !py-1.5 text-sm disabled:opacity-50"
          >
            {busy ? "…" : "Summarize"}
          </button>
        )}
      </div>
      {meta && !brief && <p className="text-xs text-ink/50 dark:text-paper/50">{meta}</p>}
      {brief && (
        <>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{brief}</div>
          <p className="mt-2 text-xs text-ink/50 dark:text-paper/50">{meta}</p>
        </>
      )}
    </div>
  );
}
