"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"otp" | "password" | "signup">("password");
  const [msg, setMsg] = useState("");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return <p className="text-sm">Auth not configured. Add Supabase keys to .env.local.</p>;
  }
  const run = async () => {
    setMsg("Working…");
    const sb = supabaseBrowser();
    const { error } =
      mode === "otp"
        ? await sb.auth.signInWithOtp({ email })
        : mode === "signup"
          ? await sb.auth.signUp({ email, password })
          : await sb.auth.signInWithPassword({ email, password });
    if (error) setMsg(error.message);
    else if (mode === "otp") setMsg("Check your email for a login link.");
    else if (mode === "signup") setMsg("Account created — sign in now.");
    else {
      setMsg("Signed in ✓");
      window.location.href = "/library";
    }
  };
  return (
    <div className="max-w-sm space-y-3">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <div className="flex gap-1 text-sm">
        {(["password", "signup", "otp"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setMsg("");
            }}
            className={`rounded-full px-3 py-1 ${mode === m ? "bg-black text-white" : "border"}`}
          >
            {m === "otp" ? "Magic link" : m === "signup" ? "Sign up" : "Password"}
          </button>
        ))}
      </div>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded border px-3 py-2"
      />
      {mode !== "otp" && (
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 6 chars)"
          className="w-full rounded border px-3 py-2"
        />
      )}
      <button onClick={run} className="rounded bg-black px-4 py-2 text-white">
        {mode === "otp" ? "Send magic link" : mode === "signup" ? "Create account" : "Sign in"}
      </button>
      {msg && <p className="text-sm">{msg}</p>}
      <p className="text-xs text-zinc-500">
        Password sign-in sends no email — use it while magic links are rate-limited.
      </p>
    </div>
  );
}
