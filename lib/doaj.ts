// DOAJ open-access journals per topic (free search, no key).
// Docs: https://doaj.org/api/docs
export interface DoajJournal {
  title: string;
  publisher: string;
  link: string | null;
}

export async function getJournals(query: string, max = 5): Promise<DoajJournal[]> {
  if (!query) return [];
  try {
    const res = await fetch(
      `https://doaj.org/api/search/journals/${encodeURIComponent(query)}?pageSize=${max}`,
      { signal: AbortSignal.timeout(10000), next: { revalidate: 86400 } },
    );
    if (!res.ok) return [];
    const j: any = await res.json();
    return ((j.results ?? []) as any[])
      .map((r) => {
        const b = r.bibjson ?? {};
        const title = typeof b.title === "string" ? b.title : null;
        if (!title) return null;
        const publisher = b.publisher?.name ?? (typeof b.publisher === "string" ? b.publisher : "");
        return { title, publisher, link: b.ref?.journal ?? null };
      })
      .filter((x): x is DoajJournal => x !== null)
      .slice(0, max);
  } catch {
    return [];
  }
}
