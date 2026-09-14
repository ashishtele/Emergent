import type { Metadata } from "next";
import { openAlex } from "@/lib/openalex";
import { getOaLocations } from "@/lib/unpaywall";
import { resolvePdfUrl } from "@/lib/pdf";
import ActivityBars from "@/components/ActivityBars";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PHUSE Hub",
  description: "Filter PHUSE community papers and render them in-app.",
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

const SORTS = [
  { id: "cited", label: "Top cited", param: "cited_by_count:desc" },
  { id: "newest", label: "Newest", param: "publication_year:desc" },
  { id: "relevant", label: "Most relevant", param: "" },
] as const;

type Filters = { q: string; sort: string; from: string; to: string };

function shortId(u: string) {
  return u?.split("/").pop() ?? u;
}

function parseFilters(sp?: Record<string, string | undefined>): Filters {
  const year = new Date().getFullYear();
  const from = /^\d{4}$/.test(sp?.from ?? "") ? sp!.from! : "";
  const to = /^\d{4}$/.test(sp?.to ?? "") ? sp!.to! : "";
  return {
    q: (sp?.q ?? "PHUSE").slice(0, 200),
    sort: SORTS.some((s) => s.id === sp?.sort) ? sp!.sort! : "cited",
    from: from && Number(from) >= 1900 && Number(from) <= year ? from : "",
    to: to && Number(to) >= 1900 && Number(to) <= year ? to : "",
  };
}

function qs(f: Filters, extra?: Record<string, string>) {
  const p = new URLSearchParams({ q: f.q, sort: f.sort });
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  for (const [k, v] of Object.entries(extra ?? {})) p.set(k, v);
  return `/phuse?${p.toString()}`;
}

export default async function PhusePage({
  searchParams,
}: {
  searchParams?: Record<string, string | undefined>;
}) {
  const f = parseFilters(searchParams);
  const sortParam = SORTS.find((s) => s.id === f.sort)!.param;
  const dateFilter = [
    f.from ? `from_publication_date:${f.from}-01-01` : null,
    f.to ? `to_publication_date:${f.to}-12-31` : null,
  ]
    .filter(Boolean)
    .join(",");

  const listParams: Record<string, string> = { search: f.q, "per-page": "10", select: SELECT };
  if (sortParam) listParams.sort = sortParam;
  if (dateFilter) listParams.filter = dateFilter;
  const actParams: Record<string, string> = {
    search: f.q,
    group_by: "publication_year",
    "per-page": "100",
  };
  if (dateFilter) actParams.filter = dateFilter;

  let works: any[] = [];
  let total = 0;
  let activity: { year: number; count: number }[] = [];
  try {
    const [lw, act] = await Promise.all([openAlex("/works", listParams), openAlex("/works", actParams)]);
    works = lw.results ?? [];
    total = lw.meta?.count ?? 0;
    activity = (act.group_by ?? [])
      .map((g: any) => ({ year: Number(g.key), count: g.count }))
      .filter((a: any) => Number.isFinite(a.year))
      .sort((a: any, b: any) => a.year - b.year)
      .slice(-8);
  } catch {
    return <p>Research data is temporarily unavailable. Please try again in a moment.</p>;
  }

  const tCount = new Map<string, { name: string; id: string; n: number }>();
  for (const w of works) {
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
          Filter the PHUSE literature and render papers right here —{" "}
          {total > 0 && `${total.toLocaleString()} matches`}
        </p>
      </div>

      <form action="/phuse" method="get" className="card flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1 basis-48 text-xs">
          <span className="mb-1 block font-semibold uppercase tracking-widest text-ink/50 dark:text-paper/50">
            Query
          </span>
          <input name="q" defaultValue={f.q} placeholder="PHUSE, SDTM, ADaM…" className="field !py-2" />
        </label>
        <label className="text-xs">
          <span className="mb-1 block font-semibold uppercase tracking-widest text-ink/50 dark:text-paper/50">
            Sort
          </span>
          <select name="sort" defaultValue={f.sort} className="field w-auto !py-2">
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="w-24 text-xs">
          <span className="mb-1 block font-semibold uppercase tracking-widest text-ink/50 dark:text-paper/50">
            From
          </span>
          <input
            name="from"
            defaultValue={f.from}
            placeholder="2015"
            inputMode="numeric"
            className="field !py-2"
          />
        </label>
        <label className="w-24 text-xs">
          <span className="mb-1 block font-semibold uppercase tracking-widest text-ink/50 dark:text-paper/50">
            To
          </span>
          <input
            name="to"
            defaultValue={f.to}
            placeholder="2026"
            inputMode="numeric"
            className="field !py-2"
          />
        </label>
        <button className="btn-primary !py-2 text-sm">Apply</button>
      </form>

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
            <Link href={qs(f)} className="chip shrink-0 !py-1 text-xs">
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
        <h2 className="section-title mb-3">Papers</h2>
        {works.length === 0 ? (
          <p className="text-sm text-ink/60 dark:text-paper/60">
            No papers match these filters. Loosen the query or year range.
          </p>
        ) : (
          <div className="space-y-2">
            {works.map((w: any) => {
              const id = shortId(w.id);
              const active = paperId && shortId(paperId) === id;
              return (
                <div
                  key={w.id}
                  className={`card flex items-start justify-between gap-4 !p-4 ${active ? "!border-accent/50" : ""}`}
                >
                  <div className="min-w-0">
                    <Link
                      href={qs(f, { paper: id })}
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
        )}
      </section>

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
    </div>
  );
}
