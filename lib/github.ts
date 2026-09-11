// Community code links via GitHub repo search (free; GITHUB_TOKEN raises limits).
// Docs: https://docs.github.com/en/rest/search/search#search-repositories
export interface CodeRepo {
  name: string;
  url: string;
  stars: number;
  description: string;
}

function headers(token?: string): Record<string, string> {
  return {
    "User-Agent": "Emergent/0.1 (research discovery)",
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function search(q: string, token?: string, max = 3): Promise<CodeRepo[]> {
  const params = new URLSearchParams({ q, sort: "stars", order: "desc", per_page: String(max) });
  const res = await fetch(`https://api.github.com/search/repositories?${params.toString()}`, {
    headers: headers(token),
    signal: AbortSignal.timeout(10000),
    next: { revalidate: 86400 },
  });
  if (!res.ok) return [];
  const j: any = await res.json();
  return ((j.items ?? []) as any[]).map((r) => ({
    name: r.full_name,
    url: r.html_url,
    stars: r.stargazers_count ?? 0,
    description: (r.description ?? "").slice(0, 140),
  }));
}

function arxivIdOf(w: { doi?: string | null; arxiv?: string | null; id?: string }): string | null {
  if (w.arxiv) return w.arxiv.replace(/^arxiv:/i, "");
  const m = (w.doi ?? w.id ?? "").match(/arxiv\.(\d+\.\d+)/i);
  return m ? m[1] : null;
}

export async function findCodeRepos(
  work: { doi?: string | null; arxiv?: string | null; arxivId?: string | null; id?: string; title?: string },
  token?: string,
): Promise<CodeRepo[]> {
  try {
    const arxiv = work.arxivId ?? arxivIdOf(work);
    if (arxiv) {
      const exact = await search(`"${arxiv}"`, token);
      if (exact.length > 0) return exact;
    }
    const words = (work.title ?? "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((x) => x.length > 3)
      .slice(0, 4)
      .join(" ");
    if (!words) return [];
    return search(`${words} in:name,description`, token);
  } catch {
    return [];
  }
}
