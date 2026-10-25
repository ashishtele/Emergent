export default function Loading() {
  return (
    <div className="space-y-2" aria-busy="true">
      <div className="h-6 w-2/3 animate-pulse rounded bg-ink/10 motion-reduce:animate-none dark:bg-white/10" />
      <div className="h-4 w-full animate-pulse rounded bg-ink/10 motion-reduce:animate-none dark:bg-white/10" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-ink/10 motion-reduce:animate-none dark:bg-white/10" />
      <p className="text-sm text-ink/60 dark:text-paper/60">Loading research data…</p>
    </div>
  );
}
