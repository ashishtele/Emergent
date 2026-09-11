"use client";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";

const TABS = ["works", "authors", "institutions", "topics"] as const;
function shortId(u: string) {
  return u?.split("/").pop() ?? u;
}

function SearchBox({
  value,
  onChange,
  onSearch,
}: {
  value: string;
  onChange: (v: string) => void;
  onSearch: (v: string) => void;
}) {
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSearch(value.trim());
      }}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search papers, researchers, topics…"
        className="field min-w-0 flex-1"
      />
      <button className="btn-primary shrink-0">Search</button>
    </form>
  );
}

function Results() {
  const sp = useSearchParams();
  const router = useRouter();
  const q = sp.get("q") ?? "";
  const type = sp.get("type") ?? "works";
  const page = parseInt(sp.get("page") ?? "1");
  const oa = sp.get("oa") === "true";
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const [input, setInput] = useState(q);

  useEffect(() => setInput(q), [q]);

  useEffect(() => {
    if (!q) return;
    setData(null);
    setErr("");
    fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}&page=${page}${oa ? "&oa=true" : ""}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setErr("Research data is temporarily unavailable."));
  }, [q, type, page, oa]);

  const nav = (patch: Record<string, string>) => {
    const p = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => p.set(k, v));
    router.push(`/search?${p.toString()}`);
  };

  if (!q)
    return (
      <div className="space-y-3">
        <SearchBox value={input} onChange={setInput} onSearch={(v) => nav({ q: v, page: "1" })} />
        <p className="text-zinc-600">Type above to explore millions of papers, researchers and topics.</p>
      </div>
    );

  return (
    <div className="space-y-3">
      <SearchBox value={input} onChange={setInput} onSearch={(v) => nav({ q: v, page: "1" })} />
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => nav({ type: t, page: "1" })}
            className={type === t ? "chip-hot" : "chip"}
          >
            {t}
          </button>
        ))}
        {type === "works" && (
          <button
            onClick={() => nav({ oa: oa ? "false" : "true", page: "1" })}
            className={oa ? "chip-hot" : "chip"}
          >
            OA only
          </button>
        )}
      </div>
      {err && <p>{err}</p>}
      {!data && !err && <p>Loading…</p>}
      {data && (
        <>
          <p className="text-sm text-zinc-600">
            {data.meta?.count?.toLocaleString()} results for “{q}”
          </p>
          {(data.results ?? []).map((r: any) => {
            const id = shortId(r.id);
            const href =
              type === "works"
                ? `/papers/${id}`
                : type === "authors"
                  ? `/authors/${id}`
                  : type === "institutions"
                    ? `/institutions/${id}`
                    : `/topics/${id}`;
            return (
              <Link key={r.id} href={href} className="card !p-4">
                <div className="break-words font-medium leading-snug">{r.title ?? r.display_name}</div>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-ink/50">
                  <span className="badge">
                    {type === "works"
                      ? `Cited by ${(r.cited_by_count ?? 0).toLocaleString()}`
                      : `${(r.works_count ?? 0).toLocaleString()} works`}
                  </span>
                  <span className="capitalize">{type.slice(0, -1)}</span>
                </div>
              </Link>
            );
          })}
          <div className="flex gap-2 text-sm">
            {page > 1 && (
              <button onClick={() => nav({ page: String(page - 1) })} className="rounded border px-3 py-1">
                ← Prev
              </button>
            )}
            <button onClick={() => nav({ page: String(page + 1) })} className="rounded border px-3 py-1">
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <Results />
    </Suspense>
  );
}
