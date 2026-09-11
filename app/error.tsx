"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-3">
      <h1 className="font-display text-xl font-bold">Research data is temporarily unavailable.</h1>
      <p className="text-sm text-ink/60 dark:text-paper/60">Please try again in a moment.</p>
      <button onClick={reset} className="btn-primary !px-5 !py-2 text-sm">
        Try again
      </button>
    </div>
  );
}
