import Link from "next/link";

// Small evidence chip: paper id, model name, or status flag.
// Replaces raw ids/strings so runs, paths and briefs share one visual language.
export default function CiteChip({
  openalexId,
  label,
  title,
}: {
  openalexId?: string;
  label?: string;
  title?: string;
}) {
  const text = label ?? openalexId ?? "";
  if (openalexId) {
    return (
      <Link
        href={`/papers/${encodeURIComponent(openalexId)}`}
        title={title ?? openalexId}
        className="inline-flex items-center rounded-full border border-ink/20 px-2.5 py-1 font-mono text-[11px] hover:underline dark:border-paper/20"
      >
        {text}
      </Link>
    );
  }
  return (
    <span
      title={title}
      className="inline-flex items-center rounded-full bg-ink/10 px-2.5 py-1 font-mono text-[11px] dark:bg-paper/10"
    >
      {text}
    </span>
  );
}
