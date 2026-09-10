import { openAlex } from "@/lib/openalex";
import Link from "next/link";
function shortId(u: string) {
  return u?.split("/").pop() ?? u;
}

export default async function AuthorPage({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  let a: any = null;
  try {
    a = await openAlex(`/authors/${encodeURIComponent(id)}`);
  } catch {
    return <p>Research data is temporarily unavailable.</p>;
  }
  const authorId = a.id?.split("/").pop() ?? id;
  let topWorks: any[] = [];
  try {
    const w = await openAlex("/works", {
      filter: `author.id:${authorId}`,
      sort: "cited_by_count:desc",
      "per-page": "5",
    });
    topWorks = w.results ?? [];
  } catch {}
  return (
    <div className="space-y-4">
      <Link href="/search" className="text-sm text-zinc-500">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold">{a.display_name}</h1>
      <div className="text-sm text-zinc-600">{a.last_known_institutions?.[0]?.display_name ?? "—"}</div>
      <div className="flex gap-2 text-xs">
        <span className="rounded border px-2 py-1">{a.works_count?.toLocaleString()} pubs</span>
        <span className="rounded border px-2 py-1">{a.cited_by_count?.toLocaleString()} cites</span>
      </div>
      <div>
        <div className="mb-1 text-sm font-semibold">Top topics</div>
        <div className="flex flex-wrap gap-1 text-xs">
          {(a.topics ?? []).slice(0, 6).map((t: any) => (
            <Link
              key={t.id}
              href={`/topics/${encodeURIComponent(shortId(t.id))}`}
              className="rounded bg-zinc-100 px-2 py-1"
            >
              {t.display_name}
            </Link>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-sm font-semibold">Selected papers</div>
        {topWorks.map((w: any) => (
          <Link
            key={w.id}
            href={`/papers/${encodeURIComponent(shortId(w.id))}`}
            className="block rounded border bg-white p-2 text-sm"
          >
            {w.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
