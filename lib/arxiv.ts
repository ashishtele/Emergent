// arXiv latest preprints per topic (free, no key, 1 req/3s etiquette).
// Docs: https://info.arxiv.org/help/api/user-manual.html
export interface Preprint {
  id: string;
  title: string;
  published: string;
  link: string;
}

function textOf(entry: string, tag: string): string {
  const m = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
}

export async function getFreshPreprints(query: string, max = 5): Promise<Preprint[]> {
  if (!query) return [];
  try {
    const params = new URLSearchParams({
      search_query: `all:${query}`,
      start: "0",
      max_results: String(max),
      sortBy: "submitted",
      sortOrder: "descending",
    });
    const res = await fetch(`https://export.arxiv.org/api/query?${params.toString()}`, {
      headers: { "User-Agent": "Emergent/0.1 (research discovery)" },
      signal: AbortSignal.timeout(15000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return xml
      .split("<entry>")
      .slice(1)
      .map((e) => {
        const abs = textOf(e, "id");
        const id = (abs.match(/abs\/([\d.]+)/) ?? [])[1] ?? abs;
        return {
          id,
          title: textOf(e, "title"),
          published: textOf(e, "published").slice(0, 10),
          link: abs.replace("http://", "https://"),
        };
      })
      .filter((p) => p.title)
      .slice(0, max);
  } catch {
    return [];
  }
}
