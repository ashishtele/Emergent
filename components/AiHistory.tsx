"use client";
import { useEffect, useState } from "react";
import CiteChip from "./CiteChip";

interface Run {
  key: string;
  kind: string;
  label: string;
  model: string | null;
  createdAt: string;
  expiresAt: string;
  preview: string;
}

// Runs table + expandable log-viewer-lite. Reads /api/ai/history (AiCache
// today, AiRun table tomorrow — same row shape on purpose).
export default function AiHistory() {
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState("Loading recent AI runs…");

  useEffect(() => {
    fetch("/api/ai/history")
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok) {
          setMsg(j.error ?? "Sign in to see AI history.");
          return;
        }
        setRuns(j.runs ?? []);
        setMsg("");
      })
      .catch(() => setMsg("Could not load AI history."));
  }, []);

  const shown = (runs ?? []).filter((r) => filter === "all" || r.kind === filter);

  return (
    <div className="card">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold">🧪 AI runs</div>
        <div className="flex gap-1 text-xs">
          {["all", "reading-path", "brief"].map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`rounded-full px-2 py-0.5 ${
                filter === k ? "bg-ink text-paper dark:bg-paper dark:text-ink" : "bg-ink/10 dark:bg-paper/10"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
      {msg && <p className="text-xs text-ink/50 dark:text-paper/50">{msg}</p>}
      {runs && shown.length === 0 && (
        <p className="text-xs text-ink/50 dark:text-paper/50">No runs yet — generate a path or brief.</p>
      )}
      {shown.length > 0 && (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-ink/50 dark:text-paper/50">
              <th className="py-1 pr-2 font-medium">Run</th>
              <th className="py-1 pr-2 font-medium">Model</th>
              <th className="py-1 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.key} className="border-t border-ink/10 align-top dark:border-paper/10">
                <td className="py-1.5 pr-2">
                  <button
                    onClick={() => setOpen(open === r.key ? null : r.key)}
                    className="text-left hover:underline"
                  >
                    <span className="mr-1 font-medium">{r.kind}</span>
                    <span className="text-ink/60 dark:text-paper/60">{r.label.slice(0, 60)}</span>
                  </button>
                  {open === r.key && (
                    <div className="mt-1 space-y-1">
                      <div className="flex flex-wrap gap-1">
                        <CiteChip label={r.kind} title="run kind" />
                        {r.model && <CiteChip label={r.model} title="model" />}
                      </div>
                      <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded bg-ink/5 p-2 font-mono text-[11px] dark:bg-paper/5">
                        {r.preview}
                        {`\n—\nkey: ${r.key}\nexpires: ${r.expiresAt}`}
                      </pre>
                    </div>
                  )}
                </td>
                <td className="py-1.5 pr-2 font-mono text-[11px]">{r.model ?? "—"}</td>
                <td className="whitespace-nowrap py-1.5 text-ink/60 dark:text-paper/60">
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
