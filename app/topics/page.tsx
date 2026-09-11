import { openAlex } from "@/lib/openalex";
import Link from "next/link";

function shortId(u: string) {
  return u?.split("/").pop() ?? u;
}

export default async function TopicsPage() {
  let topics: any[] = [];
  try {
    const d: any = await openAlex("/topics", { "per-page": "24" });
    topics = d.results ?? [];
  } catch {
    return <p>Research data is temporarily unavailable. Please try again in a moment.</p>;
  }
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-accent">Browse</p>
        <h1 className="font-display text-4xl font-black tracking-tight">Topic Explorer</h1>
      </div>
      <form action="/search" className="flex max-w-xl gap-2">
        <input type="hidden" name="type" value="topics" />
        <input name="q" placeholder="Search topics… Try: machine learning" className="field" />
        <button className="btn-primary shrink-0">Search</button>
      </form>
      <div className="grid gap-3 md:grid-cols-2">
        {topics.map((t: any) => (
          <Link key={t.id} href={`/topics/${encodeURIComponent(shortId(t.id))}`} className="card">
            <div className="font-display text-lg font-bold">{t.display_name}</div>
            <div className="mt-1 text-xs text-ink/50">
              {t.works_count?.toLocaleString()} papers · {t.field?.display_name ?? ""}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
