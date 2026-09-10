import { openAlex } from "@/lib/openalex";
import Link from "next/link";

function shortId(url: string) {
  return url?.split("/").pop() ?? url;
}

export default async function TopicPage({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  let topic: any = null;
  try {
    topic = await openAlex(`/topics/${encodeURIComponent(id)}`);
  } catch {
    return <p>Research data is temporarily unavailable. Please try again in a moment.</p>;
  }
  const topicId = topic.id?.split("/").pop() ?? id;
  let topWorks: any[] = [];
  let activity: any[] = [];
  try {
    const [tw, act] = await Promise.all([
      openAlex("/works", { filter: `topics.id:${topicId}`, sort: "cited_by_count:desc", "per-page": "5" }),
      openAlex("/works", { filter: `topics.id:${topicId}`, group_by: "publication_year", "per-page": "50" }),
    ]);
    topWorks = tw.results ?? [];
    activity = (act.group_by ?? [])
      .map((g: any) => ({ year: g.key, count: g.count }))
      .sort((a: any, b: any) => a.year - b.year)
      .slice(-8);
  } catch {
    /* non-fatal */
  }

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-zinc-500">
        ← Home
      </Link>
      <h1 className="text-2xl font-bold">{topic.display_name}</h1>
      <p className="text-sm text-zinc-600">{topic.description}</p>
      <div className="text-xs text-zinc-500">{topic.works_count?.toLocaleString()} papers</div>
      {activity.length > 0 && (
        <div className="rounded border bg-white p-3">
          <div className="mb-2 text-sm font-semibold">Research activity</div>
          <div className="flex items-end gap-1">
            {activity.map((a: any) => (
              <div
                key={a.year}
                title={`${a.year}: ${a.count}`}
                className="w-8 bg-black/80"
                style={{
                  height: `${Math.max(4, (a.count / Math.max(...activity.map((x: any) => x.count))) * 80)}px`,
                }}
              />
            ))}
          </div>
          <div className="mt-1 flex gap-1 text-[10px] text-zinc-500">
            {activity.map((a: any) => (
              <span key={a.year} className="w-8">
                {String(a.year).slice(2)}
              </span>
            ))}
          </div>
        </div>
      )}
      <div>
        <div className="mb-1 text-sm font-semibold">Top papers</div>
        {topWorks.map((w: any) => (
          <Link
            key={w.id}
            href={`/papers/${encodeURIComponent(shortId(w.id))}`}
            className="block rounded border bg-white p-2 text-sm"
          >
            {w.title} <span className="text-zinc-500">({w.cited_by_count} cites)</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
