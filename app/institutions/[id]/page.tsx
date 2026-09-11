import { openAlex } from "@/lib/openalex";
import Link from "next/link";
function shortId(u: string) {
  return u?.split("/").pop() ?? u;
}

export default async function InstitutionPage({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  let inst: any = null;
  try {
    inst = await openAlex(`/institutions/${encodeURIComponent(id)}`);
  } catch {
    return <p>Research data is temporarily unavailable.</p>;
  }
  const instId = inst.id?.split("/").pop() ?? id;
  let topWorks: any[] = [];
  try {
    const w = await openAlex("/works", {
      filter: `authorships.institutions.id:${instId}`,
      sort: "cited_by_count:desc",
      "per-page": "5",
    });
    topWorks = w.results ?? [];
  } catch {}
  return (
    <div className="space-y-4">
      <Link
        href="/search"
        className="text-sm text-ink/40 hover:text-ink dark:text-paper/40 dark:hover:text-paper"
      >
        ← Back
      </Link>
      <h1 className="font-display text-3xl font-black tracking-tight">{inst.display_name}</h1>
      <div className="text-sm text-ink/60 dark:text-paper/60">
        {inst.country_code} · {inst.type}
      </div>
      <div className="flex gap-2 text-xs">
        <span className="badge">{inst.works_count?.toLocaleString()} works</span>
        <span className="badge">{inst.cited_by_count?.toLocaleString()} cites</span>
      </div>
      <div>
        <div className="mb-1 text-sm font-semibold">Top research areas</div>
        <div className="flex flex-wrap gap-1 text-xs">
          {(inst.topics ?? []).slice(0, 6).map((t: any) => (
            <Link
              key={t.id}
              href={`/topics/${encodeURIComponent(shortId(t.id))}`}
              className="badge hover:!bg-accent hover:!text-white"
            >
              {t.display_name}
            </Link>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-sm font-semibold">Top papers</div>
        {topWorks.map((w: any) => (
          <Link
            key={w.id}
            href={`/papers/${encodeURIComponent(shortId(w.id))}`}
            className="card block !p-3 text-sm"
          >
            {w.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
