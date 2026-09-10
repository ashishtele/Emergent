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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Topic Explorer</h1>
      <form action="/search" className="flex gap-2">
        <input type="hidden" name="type" value="topics" />
        <input
          name="q"
          placeholder="Search topics… Try: machine learning"
          className="w-full rounded border px-3 py-2"
        />
        <button className="rounded bg-black px-4 py-2 text-white">Search</button>
      </form>
      <div className="grid gap-2 md:grid-cols-2">
        {topics.map((t: any) => (
          <Link
            key={t.id}
            href={`/topics/${encodeURIComponent(shortId(t.id))}`}
            className="rounded border bg-white p-3 hover:border-black"
          >
            <div className="font-medium">{t.display_name}</div>
            <div className="text-xs text-zinc-500">
              {t.works_count?.toLocaleString()} papers · {t.field?.display_name ?? ""}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
