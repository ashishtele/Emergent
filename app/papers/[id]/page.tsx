import type { Metadata } from "next";
import { openAlex, decodeAbstract } from "@/lib/openalex";
import { resolvePdfUrl, extractArxivId } from "@/lib/pdf";
import { getPaperEnrichment } from "@/lib/s2";
import { getOaLocations } from "@/lib/unpaywall";
import { findCodeRepos } from "@/lib/github";
import SaveButton from "@/components/SaveButton";
import BriefButton from "@/components/BriefButton";
import Link from "next/link";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const w: any = await openAlex(`/works/${encodeURIComponent(decodeURIComponent(params.id))}`);
    const authors = (w.authorships ?? [])
      .slice(0, 3)
      .map((a: any) => a.author?.display_name)
      .filter(Boolean)
      .join(", ");
    return {
      title: w.title?.length > 140 ? `${w.title.slice(0, 140)}…` : (w.title ?? "Paper"),
      description:
        `${authors ? `By ${authors}. ` : ""}Cited by ${w.cited_by_count?.toLocaleString() ?? 0} · ${w.publication_date ?? ""}`.trim(),
    };
  } catch {
    return { title: "Paper" };
  }
}

function shortId(url: string) {
  return url?.split("/").pop() ?? url;
}

export default async function PaperPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { tab?: string };
}) {
  const id = decodeURIComponent(params.id);
  let w: any = null;
  try {
    w = await openAlex(`/works/${encodeURIComponent(id)}`);
  } catch {
    return <p>Research data is temporarily unavailable. Please try again in a moment.</p>;
  }
  const tab = searchParams?.tab === "read" ? "read" : "overview";
  const pid = shortId(w.id);
  const abstract = decodeAbstract(w.abstract_inverted_index);
  const [tldr, oa] = w.doi
    ? await Promise.all([
        getPaperEnrichment(w.doi, process.env.S2_API_KEY),
        getOaLocations(w.doi, process.env.UNPAYWALL_EMAIL ?? process.env.OPENALEX_MAILTO),
      ])
    : [null, null];
  const arxivId = extractArxivId(w);
  const pdfUrl = resolvePdfUrl(w, oa?.pdfUrl);
  const code = await findCodeRepos({ arxiv: arxivId, doi: w.doi, title: w.title }, process.env.GITHUB_TOKEN);
  return (
    <div className="max-w-3xl space-y-5">
      <Link
        href="/search"
        className="text-sm text-ink/40 hover:text-ink dark:text-paper/40 dark:hover:text-paper"
      >
        ← Back to search
      </Link>
      <h1 className="font-display text-3xl font-black leading-tight tracking-tight md:text-4xl">{w.title}</h1>
      <div className="text-sm text-ink/60 dark:text-paper/60">
        {(w.authorships ?? []).slice(0, 8).map((a: any, i: number) => (
          <span key={a.author?.id ?? i}>
            {i > 0 && " · "}
            <Link
              href={`/authors/${encodeURIComponent(shortId(a.author?.id ?? ""))}`}
              className="hover:underline"
            >
              {a.author?.display_name}
            </Link>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="badge">{w.publication_date}</span>
        <span className="badge">Cited by {w.cited_by_count?.toLocaleString()}</span>
        {w.open_access?.is_oa && <span className="badge !bg-moss !text-paper">Open access</span>}
        {(w.topics ?? []).slice(0, 4).map((t: any) => (
          <Link
            key={t.id}
            href={`/topics/${encodeURIComponent(shortId(t.id))}`}
            className="badge !bg-accent/10 !text-accent hover:!bg-accent hover:!text-white"
          >
            {t.display_name}
          </Link>
        ))}
      </div>
      {w.doi && (
        <a href={w.doi} className="text-sm text-accent hover:underline">
          {w.doi}
        </a>
      )}
      <div className="flex gap-1.5 text-sm">
        <Link
          href={`/papers/${encodeURIComponent(pid)}`}
          className={tab === "overview" ? "chip-hot" : "chip"}
        >
          Overview
        </Link>
        <Link
          href={`/papers/${encodeURIComponent(pid)}?tab=read`}
          className={tab === "read" ? "chip-hot" : "chip"}
        >
          Read PDF{pdfUrl ? "" : " · unavailable"}
        </Link>
      </div>
      {tab === "read" ? (
        <div className="space-y-3">
          {pdfUrl ? (
            <div className="space-y-2">
              <iframe
                src={pdfUrl}
                title={`PDF of ${w.title}`}
                className="h-[72vh] w-full rounded-2xl border border-ink/10 bg-white dark:border-white/10"
              />
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="block text-sm text-accent hover:underline"
              >
                Open PDF in new tab ↗
              </a>
            </div>
          ) : (
            <div className="card space-y-2">
              <div className="text-sm font-semibold">No free PDF found</div>
              <p className="text-sm text-ink/60 dark:text-paper/60">
                This paper isn&apos;t openly available, so there&apos;s nothing to render here. Try the
                publisher page or save it and request a brief instead.
              </p>
              {w.doi && (
                <a
                  href={w.doi}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm text-accent hover:underline"
                >
                  Publisher page ↗
                </a>
              )}
            </div>
          )}
          <SaveButton id={pid} title={w.title} />
          <BriefButton openalexId={pid} />
        </div>
      ) : (
        <>
          {pdfUrl && (
            <Link href={`/papers/${encodeURIComponent(pid)}?tab=read`} className="btn-primary w-fit text-sm">
              Read PDF in app
            </Link>
          )}
          <p className="leading-relaxed text-ink/80 dark:text-paper/80">
            {abstract || "No abstract available."}
          </p>
          {tldr && (
            <div className="card !border-accent/30">
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                TLDR · Semantic Scholar
              </div>
              <p className="text-sm">{tldr.tldr}</p>
            </div>
          )}
          {(w.related_works?.length > 0 || w.referenced_works?.length > 0) && (
            <div className="grid gap-3 md:grid-cols-2">
              {w.related_works?.length > 0 && (
                <div className="card">
                  <div className="mb-1 text-sm font-semibold">Related papers</div>
                  {w.related_works.slice(0, 5).map((u: string) => (
                    <Link
                      key={u}
                      href={`/papers/${encodeURIComponent(shortId(u))}`}
                      className="block py-0.5 text-xs text-accent hover:underline"
                    >
                      {shortId(u)}
                    </Link>
                  ))}
                </div>
              )}
              {w.referenced_works?.length > 0 && (
                <div className="card">
                  <div className="mb-1 text-sm font-semibold">References</div>
                  {w.referenced_works.slice(0, 5).map((u: string) => (
                    <Link
                      key={u}
                      href={`/papers/${encodeURIComponent(shortId(u))}`}
                      className="block py-0.5 text-xs text-accent hover:underline"
                    >
                      {shortId(u)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          <SaveButton id={pid} title={w.title} />
          <BriefButton openalexId={pid} />
          {code.length > 0 && (
            <div className="card">
              <div className="mb-2 text-sm font-semibold">💻 Community code</div>
              <div className="space-y-2">
                {code.map((r) => (
                  <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="block text-sm">
                    <span className="font-medium hover:underline">{r.name}</span>{" "}
                    <span className="text-xs text-ink/50 dark:text-paper/50">
                      ★ {r.stars.toLocaleString()}
                    </span>
                    {r.description && (
                      <div className="text-xs text-ink/60 dark:text-paper/60">{r.description}</div>
                    )}
                  </a>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-ink/40 dark:text-paper/40">
                GitHub search, may be approximate
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
