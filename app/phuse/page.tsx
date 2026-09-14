import type { Metadata } from "next";
import {
  fetchArchive,
  fetchArchiveRecord,
  paperFile,
  phuseFileUrl,
  PHUSE_CATEGORIES,
  PHUSE_EVENTS,
  PHUSE_REGIONS,
  type PhuseFilters,
} from "@/lib/phuse";
import BriefButton from "@/components/BriefButton";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PHUSE Hub",
  description: "Search the PHUSE archive — Connects, webinars and working groups — and render papers in-app.",
};

type SP = Record<string, string | undefined>;

function parseFilters(sp?: SP): PhuseFilters {
  const clean = (v?: string) => (v ?? "").slice(0, 120).trim();
  const oneOf = (v: string, list: string[]) => (list.includes(v) ? v : "");
  return {
    event: oneOf(clean(sp?.event), PHUSE_EVENTS),
    year: /^\d{4}$/.test(clean(sp?.year)) ? clean(sp?.year) : "",
    region: oneOf(clean(sp?.region), PHUSE_REGIONS),
    city: clean(sp?.city),
    category: oneOf(clean(sp?.category), PHUSE_CATEGORIES),
    title: clean(sp?.title),
    company: clean(sp?.company),
    author: clean(sp?.author),
    coAuthor: clean(sp?.coAuthor),
    keywords: clean(sp?.keywords),
  };
}

function qs(f: PhuseFilters, extra?: Record<string, string>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v) p.set(k, v);
  for (const [k, v] of Object.entries(extra ?? {})) {
    if (v) p.set(k, v);
    else p.delete(k);
  }
  const s = p.toString();
  return s ? `/phuse?${s}` : "/phuse";
}

function Bar({ label, count, max }: { label: string; count: number; max: number }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="truncate">{label}</span>
        <span className="shrink-0 tabular-nums text-ink/50 dark:text-paper/50">{count}</span>
      </div>
      <div className="h-1.5 rounded-full bg-ink/10 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${Math.max(4, (count / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function topEntries(m: Map<string, number>, n: number) {
  return Array.from(m.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

const INPUT = "field !py-2 text-sm";
const LABEL = "mb-1 block font-semibold uppercase tracking-widest text-ink/50 dark:text-paper/50";

export default async function PhusePage({ searchParams }: { searchParams?: SP }) {
  const f = parseFilters(searchParams);
  const page = Math.max(1, parseInt(searchParams?.page ?? "1") || 1);
  const docId = searchParams?.doc ?? null;

  let records: Awaited<ReturnType<typeof fetchArchive>>["records"] = [];
  let total = 0;
  let pageCount = 0;
  let landscape: {
    companies: [string, number][];
    categories: [string, number][];
    regions: [string, number][];
    span: string;
  } | null = null;
  try {
    const [r, wide] = await Promise.all([fetchArchive(f, page, 10), fetchArchive(f, 1, 100)]);
    records = r.records;
    total = r.total;
    pageCount = r.pageCount;
    const comp = new Map<string, number>();
    const cat = new Map<string, number>();
    const reg = new Map<string, number>();
    let minY = Infinity;
    let maxY = -Infinity;
    for (const w of wide.records) {
      if (w.company) comp.set(w.company, (comp.get(w.company) ?? 0) + 1);
      if (w.category) cat.set(w.category, (cat.get(w.category) ?? 0) + 1);
      if (w.region) reg.set(w.region, (reg.get(w.region) ?? 0) + 1);
      const y = Number(w.year);
      if (Number.isFinite(y)) {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
    landscape = {
      companies: topEntries(comp, 8),
      categories: topEntries(cat, 6),
      regions: topEntries(reg, 4),
      span:
        minY <= maxY ? `${minY}–${maxY} · top ${wide.records.length} of ${wide.total.toLocaleString()}` : "",
    };
  } catch {
    return <p>PHUSE archive is temporarily unavailable. Please try again in a moment.</p>;
  }

  const selected = docId ? await fetchArchiveRecord(docId) : null;
  const selectedPaper = selected ? paperFile(selected.files) : null;
  const selectedUrl = selected && selectedPaper ? phuseFileUrl(selected, selectedPaper) : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-accent">Community hub</p>
        <h1 className="font-display text-4xl font-black tracking-tight">PHUSE</h1>
        <p className="mt-2 max-w-xl text-sm text-ink/60 dark:text-paper/60">
          The PHUSE archive — {total.toLocaleString()} materials from Connects, webinars and working groups.
          Filter exactly like{" "}
          <a
            href="https://phuse.global/Communications/PHUSE_Archive"
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            phuse.global ↗
          </a>
          , then render a paper right here.
        </p>
      </div>

      <form action="/phuse" method="get" className="card grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs">
          <span className={LABEL}>Event type</span>
          <select name="event" defaultValue={f.event} className={INPUT}>
            <option value="">All events</option>
            {PHUSE_EVENTS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className={LABEL}>Year</span>
          <input name="year" defaultValue={f.year} placeholder="2024" inputMode="numeric" className={INPUT} />
        </label>
        <label className="text-xs">
          <span className={LABEL}>Region</span>
          <select name="region" defaultValue={f.region} className={INPUT}>
            <option value="">All regions</option>
            {PHUSE_REGIONS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className={LABEL}>City</span>
          <input name="city" defaultValue={f.city} placeholder="Austin…" className={INPUT} />
        </label>
        <label className="text-xs">
          <span className={LABEL}>Educational category</span>
          <select name="category" defaultValue={f.category} className={INPUT}>
            <option value="">All categories</option>
            {PHUSE_CATEGORIES.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className={LABEL}>Title</span>
          <input name="title" defaultValue={f.title} placeholder="e.g. SDTM…" className={INPUT} />
        </label>
        <label className="text-xs">
          <span className={LABEL}>Author</span>
          <input name="author" defaultValue={f.author} placeholder="Surname…" className={INPUT} />
        </label>
        <label className="text-xs">
          <span className={LABEL}>Co-author</span>
          <input name="coAuthor" defaultValue={f.coAuthor} placeholder="Surname…" className={INPUT} />
        </label>
        <label className="text-xs">
          <span className={LABEL}>Company</span>
          <input name="company" defaultValue={f.company} placeholder="e.g. Pfizer…" className={INPUT} />
        </label>
        <label className="text-xs">
          <span className={LABEL}>Key words</span>
          <input name="keywords" defaultValue={f.keywords} placeholder="e.g. ADaM…" className={INPUT} />
        </label>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
          <button className="btn-primary !py-2 text-sm">Search archive</button>
          <Link href="/phuse" className="chip !py-2 text-sm">
            Reset
          </Link>
          {total > 0 && (
            <span className="pb-2 text-sm text-ink/50 dark:text-paper/50">
              {total.toLocaleString()} matches
            </span>
          )}
        </div>
      </form>

      {selected && (
        <section className="card space-y-3 !border-accent/40">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                Now reading · PHUSE archive
              </div>
              <div className="break-words font-display text-xl font-bold leading-snug">{selected.title}</div>
              <div className="mt-1 text-xs text-ink/50 dark:text-paper/50">
                {[selected.author, selected.company, selected.event, selected.year, selected.city]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
            <Link
              href={qs(f, { page: page > 1 ? String(page) : "" })}
              className="chip shrink-0 !py-1 text-xs"
            >
              ✕ Close
            </Link>
          </div>
          {selectedUrl ? (
            <div className="space-y-2">
              <iframe
                src={selectedUrl}
                title={selected.title}
                className="h-[70vh] w-full rounded-xl border border-ink/10 bg-white dark:border-white/10"
              />
              <a
                href={selectedUrl}
                target="_blank"
                rel="noreferrer"
                className="block text-sm text-accent hover:underline"
              >
                Open PDF in new tab ↗
              </a>
              <BriefButton pdfUrl={selectedUrl} title={selected.title} />
            </div>
          ) : (
            <p className="text-sm text-ink/60 dark:text-paper/60">
              No paper file attached to this record — it may be slides-only.
            </p>
          )}
        </section>
      )}

      {landscape && landscape.companies.length > 0 && (
        <section>
          <h2 className="section-title mb-1">Industry landscape</h2>
          <p className="mb-3 text-xs text-ink/50 dark:text-paper/50">
            Who publishes here, in what — {landscape.span || "current filters"}
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="card space-y-2">
              <div className="text-sm font-semibold">Top companies</div>
              {landscape.companies.map(([name, n]) => (
                <Bar key={name} label={name} count={n} max={landscape.companies[0][1]} />
              ))}
            </div>
            <div className="card space-y-2">
              <div className="text-sm font-semibold">Categories</div>
              {landscape.categories.map(([name, n]) => (
                <Bar key={name} label={name} count={n} max={landscape.categories[0][1]} />
              ))}
            </div>
            <div className="card space-y-2">
              <div className="text-sm font-semibold">Regions</div>
              {landscape.regions.map(([name, n]) => (
                <Bar key={name} label={name} count={n} max={landscape.regions[0][1]} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title mb-3">Archive papers</h2>
        {records.length === 0 ? (
          <p className="text-sm text-ink/60 dark:text-paper/60">
            Nothing matches these filters. Loosen a field or reset.
          </p>
        ) : (
          <div className="space-y-2">
            {records.map((r) => {
              const paper = paperFile(r.files);
              const slides = r.files.find((x) => /PRE_/i.test(x) && x !== paper);
              return (
                <div key={r.id} className={`card !p-4 ${docId === r.id ? "!border-accent/50" : ""}`}>
                  <Link
                    href={qs(f, { doc: r.id, page: page > 1 ? String(page) : "" })}
                    className="break-words font-medium leading-snug hover:text-accent"
                  >
                    {r.title}
                  </Link>
                  <div className="mt-1 text-xs text-ink/50 dark:text-paper/50">
                    {[r.author, r.company].filter(Boolean).join(", ")}
                    {" · "}
                    {[r.event, r.year, r.city, r.region].filter(Boolean).join(" · ")}
                    {r.category && ` · ${r.category}`}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    {paper && (
                      <Link
                        href={qs(f, { doc: r.id, page: page > 1 ? String(page) : "" })}
                        className="font-semibold text-accent hover:underline"
                      >
                        Read paper here →
                      </Link>
                    )}
                    {slides && (
                      <a
                        href={phuseFileUrl(r, slides)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink/60 hover:underline dark:text-paper/60"
                      >
                        Slides ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {pageCount > 1 && (
          <div className="mt-3 flex gap-2 text-sm">
            {page > 1 && (
              <Link href={qs(f, { page: String(page - 1), doc: docId ?? "" })} className="chip">
                ← Prev
              </Link>
            )}
            <span className="px-2 py-1.5 text-xs text-ink/50 dark:text-paper/50">
              Page {page} of {pageCount.toLocaleString()}
            </span>
            {page < pageCount && (
              <Link href={qs(f, { page: String(page + 1), doc: docId ?? "" })} className="chip">
                Next →
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
