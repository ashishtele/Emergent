import type { Metadata } from "next";
import { openAlex } from "@/lib/openalex";
import { getOaLocations } from "@/lib/unpaywall";
import { resolvePdfUrl } from "@/lib/pdf";
import ActivityBars from "@/components/ActivityBars";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PHUSE Hub",
  description:
    "PHUSE community papers — CDISC standards, SDTM, ADaM and de-identification — rendered in-app.",
};

const QUERY = "PHUSE";
const SELECT =
  "id,title,doi,publication_year,cited_by_count,authorships,open_access,best_oa_location,locations,topics";

function shortId(u: string) {
  return u?.split("/").pop() ?? u;
}

export default async function PhusePage({ searchParams }: { searchParams?: { paper?: string } }) {
  let top: any[] = [];
  let total = 0;
  let activity: { year: number; count: number }[] = [];
  try {
    const [tw, act] = await Promise.all([
      openAlex("/works", {
        search: QUERY,
        sort: "cited_by_count:desc",
        "per-page": "8",
        select: SELECT,
      }),
      openAlex("/works", { search: QUERY, group_by: "publication_year", "per-page": "50" }),
    ]);
    top = tw.results ?? [];
    total = tw.meta?.count ?? 0;
    activity = (act.group_by ?? [])
      .map((g: any) => ({ year: Number(g.key), count: g.count }))
      .filter((a: any) => Number.isFinite(a.year))
      .sort((a: any, b: any) => a.year - b.year)
      .slice(-8);
  } catch {
    return <p>Research data is temporarily unavailable. Please try again in a moment.</p>;
  }

  const topics = new Map<string, { name: string; id: string }>();
  for (const w of top) {
    for (const t of w.topics ?? []) {
      if (!topics.has(t.id)) topics.set(t.id, { name: t.display_name, id: shortId(t.id) });
      if (topics.size >= 6) break;
    }
    if (topics.size >= 6) break;
  }

  const paperId = searchParams?.paper ? decodeURIComponent(searchParams.paper) : null;
  let selected: any = null;
  let pdfUrl: string | null = null;
  if (paperId) {
    try {
      selected = await openAlex(`/works/${encodeURIComponent(paperId)}`);
      const oa = selected.doi
        ? await getOaLocations(selected.doi, process.env.UNPAYWALL_EMAIL ?? process.env.OPENALEX_MAILTO)
        : null;
      pdfUrl = resolvePdfUrl(selected, oa?.pdfUrl);
    } catch {
      selected = null;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-accent">Community hub</p>
        <h1 className="font-display text-4xl font-black tracking-tight">PHUSE</h1>
        <p className="mt-2 max-w-xl text-sm text-ink/60 dark:text-paper/60">
          Clinical data science — CDISC standards, SDTM/ADaM, de-identification.{" "}
          {total > 0 && `${total.toLocaleString()} papers in OpenAlex.`} Pick one to render it right here.
        </p>
      </div>

      {selected && (
        <section className="card space-y-3 !border-accent/40">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Now reading</div>
              <div className="break-words font-display text-xl font-bold leading-snug">{selected.title}</div>
              <div className="mt-1 text-xs text-ink/50 dark:text-paper/50">
                {(selected.authorships ?? [])
                  .slice(0, 4)
                  .map((a: any) => a.author?.display_name)
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
            <Link href="/phuse" className="chip shrink-0 !py-1 text-xs">
              ✕ Close
            </Link>
          </div>
          {pdfUrl ? (
            <div className="space-y-2">
              <iframe
                src={pdfUrl}
                title={`PDF of ${selected.title}`}
                className="h-[70vh] w-full rounded-xl border border-ink/10 bg-white dark:border-white/10"
              />
              <div className="flex flex-wrap gap-3 text-sm">
                <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                  Open PDF ↗
                </a>
                <Link
                  href={`/papers/${encodeURIComponent(shortId(selected.id))}`}
                  className="text-accent hover:underline"
                >
                  Full paper page →
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink/60 dark:text-paper/60">
              No free PDF for this one.{" "}
              <Link
                href={`/papers/${encodeURIComponent(shortId(selected.id))}`}
                className="text-accent hover:underline"
              >
                Open the full paper page →
              </Link>
            </p>
          )}
        </section>
      )}

      {activity.length > 0 && <ActivityBars activity={activity} />}

      {topics.size > 0 && (
        <section>
          <h2 className="section-title mb-3">Related topics</h2>
          <div className="flex flex-wrap gap-2">
            {Array.from(topics.values()).map((t) => (
              <Link key={t.id} href={`/topics/${encodeURIComponent(t.id)}`} className="chip">
                {t.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title mb-3">Top-cited PHUSE papers</h2>
        <div className="space-y-2">
          {top.map((w: any) => {
            const id = shortId(w.id);
            const active = paperId && shortId(paperId) === id;
            return (
              <div
                key={w.id}
                className={`card flex items-start justify-between gap-4 !p-4 ${active ? "!border-accent/50" : ""}`}
              >
                <div className="min-w-0">
                  <Link
                    href={`/phuse?paper=${encodeURIComponent(id)}`}
                    className="break-words font-medium leading-snug hover:text-accent"
                  >
                    {w.title}
                  </Link>
                  <div className="mt-1 text-xs text-ink/50 dark:text-paper/50">
                    {w.publication_year} ·{" "}
                    {(w.authorships ?? [])
                      .slice(0, 3)
                      .map((a: any) => a.author?.display_name)
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <div className="font-display text-xl font-black tabular-nums">
                    {(w.cited_by_count ?? 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-ink/40 dark:text-paper/40">cites</div>
                  <Link
                    href={`/papers/${encodeURIComponent(id)}`}
                    className="text-xs text-accent hover:underline"
                  >
                    Full page ↗
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
