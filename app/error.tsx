"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Research data is temporarily unavailable.</h1>
      <p className="text-sm text-zinc-600">Please try again in a moment.</p>
      <button onClick={reset} className="rounded bg-black px-4 py-2 text-sm text-white">
        Try again
      </button>
    </div>
  );
}
