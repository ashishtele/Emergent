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
      <Link href="/search" className="text-sm text-zinc-500">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold">{inst.display_name}</h1>
      <div className="text-sm text-zinc-600">
        {inst.country_code} · {inst.type}
      </div>
      <div className="flex gap-2 text-xs">
        <span className="rounded border px-2 py-1">{inst.works_count?.toLocaleString()} works</span>
        <span className="rounded border px-2 py-1">{inst.cited_by_count?.toLocaleString()} cites</span>
      </div>
      <div>
        <div className="mb-1 text-sm font-semibold">Top research areas</div>
        <div className="flex flex-wrap gap-1 text-xs">
          {(inst.topics ?? []).slice(0, 6).map((t: any) => (
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
        <div className="text-sm font-semibold">Top papers</div>
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
