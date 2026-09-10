export default function Loading() {
  return (
    <div className="space-y-2" aria-busy="true">
      <div className="h-6 w-2/3 animate-pulse rounded bg-zinc-200" />
      <div className="h-4 w-full animate-pulse rounded bg-zinc-200" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-200" />
      <p className="text-sm text-zinc-500">Loading research data…</p>
    </div>
  );
}
