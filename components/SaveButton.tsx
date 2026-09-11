"use client";
import { useState } from "react";

export default function SaveButton({ id, title }: { id: string; title: string }) {
  const [msg, setMsg] = useState("");
  const save = async () => {
    setMsg("Saving…");
    const res = await fetch(`/api/papers/${encodeURIComponent(id)}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const j = await res.json().catch(() => ({}));
    setMsg(res.ok ? "Saved ✓" : (j.error ?? "Failed — sign in first."));
  };
  return (
    <div className="flex items-center gap-2">
      <button onClick={save} className="btn-primary !px-5 !py-2 text-sm">
        Save Paper
      </button>
      {msg && <span className="text-xs text-ink/60">{msg}</span>}
    </div>
  );
}
