"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return <p className="text-sm">Auth not configured. Add Supabase keys to .env.local.</p>;
  }
  const send = async () => {
    setMsg("Sending…");
    const { error } = await supabaseBrowser().auth.signInWithOtp({ email });
    setMsg(error ? error.message : "Check your email for a login link.");
  };
  return (
    <div className="max-w-sm space-y-3">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded border px-3 py-2"
      />
      <button onClick={send} className="rounded bg-black px-4 py-2 text-white">
        Send magic link
      </button>
      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}
