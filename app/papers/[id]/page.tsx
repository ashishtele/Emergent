import { openAlex, decodeAbstract } from "@/lib/openalex";
import { getPaperEnrichment } from "@/lib/s2";
import { getOaLocations } from "@/lib/unpaywall";
import SaveButton from "@/components/SaveButton";
import BriefButton from "@/components/BriefButton";
import Link from "next/link";

export const revalidate = 3600;

function shortId(url: string) {
  return url?.split("/").pop() ?? url;
}

export default async function PaperPage({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  let w: any = null;
  try {
    w = await openAlex(`/works/${encodeURIComponent(id)}`);
  } catch {
    return <p>Research data is temporarily unavailable. Please try again in a moment.</p>;
  }
  const abstract = decodeAbstract(w.abstract_inverted_index);
  const [tldr, oa] = w.doi
    ? await Promise.all([
        getPaperEnrichment(w.doi, process.env.S2_API_KEY),
        getOaLocations(w.doi, process.env.UNPAYWALL_EMAIL ?? process.env.OPENALEX_MAILTO),
      ])
    : [null, null];
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
      {oa?.pdfUrl && (
        <a href={oa.pdfUrl} className="btn-primary w-fit text-sm">
          Read free PDF
        </a>
      )}
      <p className="leading-relaxed text-ink/80 dark:text-paper/80">{abstract || "No abstract available."}</p>
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
      <SaveButton id={shortId(w.id)} title={w.title} />
      <BriefButton openalexId={shortId(w.id)} />
    </div>
  );
}
