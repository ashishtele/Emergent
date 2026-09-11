import { openAlex } from "@/lib/openalex";
import ReadingPath from "@/components/ReadingPath";
import ActivityBars from "@/components/ActivityBars";
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
      <Link href="/" className="text-sm text-ink/40 hover:text-ink dark:text-paper/40 dark:hover:text-paper">
        ← Home
      </Link>
      <h1 className="font-display text-3xl font-black tracking-tight">{topic.display_name}</h1>
      <p className="text-sm text-ink/60 dark:text-paper/60">{topic.description}</p>
      <div className="text-xs text-ink/50 dark:text-paper/50">
        {topic.works_count?.toLocaleString()} papers
      </div>
      {activity.length > 0 && <ActivityBars activity={activity} />}
      <ReadingPath topic={topic.display_name} topicId={topicId} />
      <div>
        <div className="mb-1 text-sm font-semibold">Top papers</div>
        {topWorks.map((w: any) => (
          <Link
            key={w.id}
            href={`/papers/${encodeURIComponent(shortId(w.id))}`}
            className="card block !p-3 text-sm"
          >
            {w.title} <span className="text-ink/50 dark:text-paper/50">({w.cited_by_count} cites)</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
