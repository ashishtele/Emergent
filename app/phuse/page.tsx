import type { Metadata } from "next";
import { openAlex, decodeAbstract } from "@/lib/openalex";
import { getOaLocations } from "@/lib/unpaywall";
import { resolvePdfUrl } from "@/lib/pdf";
import ActivityBars from "@/components/ActivityBars";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PHUSE Hub",
  description: "PHUSE community papers — working groups, white papers and CDISC standards — rendered in-app.",
};

const SELECT =
  "id,title,doi,publication_year,cited_by_count,authorships,open_access,best_oa_location,locations,topics";

const OFFICIAL = [
  {
    name: "PHUSE Archive",
    href: "https://phuse.global/Communications/PHUSE_Archive",
    note: "Connects, events & webinars",
  },
  {
    name: "Working Group Deliverables",
    href: "https://phuse.global/Deliverables",
    note: "White papers & references",
  },
  { name: "PHUSE Blog", href: "https://phuse.global/Communications/PHUSE_Blog", note: "Community updates" },
];

// Known OpenAlex indexing artifact: "β-phase" mangled to token "phuse".
const EXCLUDE = new Set(["https://openalex.org/W2135162819"]);

function shortId(u: string) {
  return u?.split("/").pop() ?? u;
}

export default async function PhusePage({ searchParams }: { searchParams?: { paper?: string } }) {
  // Precision over recall: PHUSE in title or abstract = actually about PHUSE work.
  // (Full-text search returns 1,000+ incidental mentions; phuse.global has no
  // OpenAlex source entity and its archive is login-walled, so it can't be pulled.)
  let merged: any[] = [];
  try {
    const [tList, aList] = await Promise.all([
      openAlex("/works", {
        filter: "title.search:PHUSE",
        sort: "cited_by_count:desc",
        "per-page": "30",
        select: SELECT,
      }),
      openAlex("/works", {
        filter: "abstract.search:PHUSE",
        sort: "cited_by_count:desc",
        "per-page": "60",
        select: SELECT,
      }),
    ]);
    const seen = new Map<string, any>();
    for (const w of (tList.results ?? []).concat(aList.results ?? [])) {
      if (!seen.has(w.id) && !EXCLUDE.has(w.id)) seen.set(w.id, w);
    }
    merged = Array.from(seen.values());
    // OpenAlex search stems ("diffuse" matches "phuse"), so verify each
    // candidate literally mentions PHUSE in its title or abstract.
    try {
      const ids = merged.map((w) => shortId(w.id)).join("|");
      const full: any = ids
        ? await openAlex("/works", {
            filter: `openalex:${ids}`,
            "per-page": "100",
            select: "id,title,abstract_inverted_index",
          })
        : { results: [] };
      const ok = new Set<string>();
      for (const w of full.results ?? []) {
        if (/phuse/i.test(`${w.title ?? ""} ${decodeAbstract(w.abstract_inverted_index)}`)) {
          ok.add(w.id);
        }
      }
      merged = merged.filter((w) => ok.has(w.id));
    } catch {
      /* keep unverified candidates */
    }
    merged.sort((a, b) => (b.cited_by_count ?? 0) - (a.cited_by_count ?? 0));
  } catch {
    return <p>Research data is temporarily unavailable. Please try again in a moment.</p>;
  }

  const top = merged.slice(0, 8);

  const byYear = new Map<number, number>();
  for (const w of merged) {
    if (w.publication_year) byYear.set(w.publication_year, (byYear.get(w.publication_year) ?? 0) + 1);
  }
  const activity = Array.from(byYear.entries())
    .sort((a, b) => a[0] - b[0])
    .slice(-8)
    .map(([year, count]) => ({ year, count }));

  const tCount = new Map<string, { name: string; id: string; n: number }>();
  for (const w of merged) {
    for (const t of w.topics ?? []) {
      const e = tCount.get(t.id) ?? { name: t.display_name, id: shortId(t.id), n: 0 };
      e.n += 1;
      tCount.set(t.id, e);
    }
  }
  const topics = Array.from(tCount.values())
    .sort((a, b) => b.n - a.n)
    .slice(0, 6);

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
          Working-group papers, white papers and CDISC standards work — {merged.length} papers with PHUSE in
          the title or abstract. Pick one to render it right here.
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

      <section>
        <h2 className="section-title mb-3">On phuse.global</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {OFFICIAL.map((o) => (
            <a key={o.href} href={o.href} target="_blank" rel="noreferrer" className="card block">
              <div className="font-display text-lg font-bold">
                {o.name} <span className="text-accent">↗</span>
              </div>
              <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">{o.note}</p>
            </a>
          ))}
        </div>
      </section>

      {activity.length > 0 && <ActivityBars activity={activity} />}

      {topics.length > 0 && (
        <section>
          <h2 className="section-title mb-3">Related topics</h2>
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <Link key={t.id} href={`/topics/${encodeURIComponent(t.id)}`} className="chip">
                {t.name} <span className="opacity-60">· {t.n}</span>
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
