import { openAlex, decodeAbstract } from "@/lib/openalex";
import SaveButton from "@/components/SaveButton";
import Link from "next/link";

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
  return (
    <div className="space-y-4">
      <Link href="/search" className="text-sm text-zinc-500">
        ← Back to search
      </Link>
      <h1 className="text-2xl font-bold">{w.title}</h1>
      <div className="text-sm text-zinc-600">
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
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded border px-2 py-1">{w.publication_date}</span>
        <span className="rounded border px-2 py-1">Cited by {w.cited_by_count}</span>
        {w.open_access?.is_oa && <span className="rounded border px-2 py-1">Open access</span>}
        {(w.topics ?? []).slice(0, 4).map((t: any) => (
          <Link
            key={t.id}
            href={`/topics/${encodeURIComponent(shortId(t.id))}`}
            className="rounded bg-zinc-100 px-2 py-1"
          >
            {t.display_name}
          </Link>
        ))}
      </div>
      {w.doi && (
        <a href={w.doi} className="text-sm text-blue-600">
          {w.doi}
        </a>
      )}
      <p className="text-sm leading-relaxed">{abstract || "No abstract available."}</p>
      {(w.related_works?.length > 0 || w.referenced_works?.length > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {w.related_works?.length > 0 && (
            <div className="rounded border bg-white p-3">
              <div className="mb-1 text-sm font-semibold">Related papers</div>
              {w.related_works.slice(0, 5).map((u: string) => (
                <Link
                  key={u}
                  href={`/papers/${encodeURIComponent(shortId(u))}`}
                  className="block py-0.5 text-xs text-blue-600 hover:underline"
                >
                  {shortId(u)}
                </Link>
              ))}
            </div>
          )}
          {w.referenced_works?.length > 0 && (
            <div className="rounded border bg-white p-3">
              <div className="mb-1 text-sm font-semibold">References</div>
              {w.referenced_works.slice(0, 5).map((u: string) => (
                <Link
                  key={u}
                  href={`/papers/${encodeURIComponent(shortId(u))}`}
                  className="block py-0.5 text-xs text-blue-600 hover:underline"
                >
                  {shortId(u)}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
      <SaveButton id={shortId(w.id)} title={w.title} />
    </div>
  );
}
