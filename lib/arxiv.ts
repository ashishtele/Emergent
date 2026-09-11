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

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "in",
  "of",
  "and",
  "or",
  "to",
  "for",
  "on",
  "with",
  "from",
  "by",
  "as",
  "at",
  "is",
  "are",
  "its",
  "it",
  "that",
  "this",
]);

// Long topic names over-constrain arXiv's AND search ("AI in Healthcare and
// Education" matches almost nothing). Keep the distinctive core, max 4 words.
export function topicKeywords(topic: string): string {
  const words = topic
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .slice(0, 4);
  return words.join(" ") || topic;
}

async function queryArxiv(q: string, max: number): Promise<Preprint[]> {
  const params = new URLSearchParams({
    search_query: `all:${q}`,
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
}

export async function getFreshPreprints(query: string, max = 5): Promise<Preprint[]> {
  if (!query) return [];
  try {
    const full = topicKeywords(query);
    const first = await queryArxiv(full, max);
    if (first.length > 0) return first;
    // Fallback: shorter query (first two keywords) for recall.
    const short = full.split(" ").slice(0, 2).join(" ");
    if (short && short !== full) return queryArxiv(short, max);
    return [];
  } catch {
    return [];
  }
}
