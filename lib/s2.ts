// Semantic Scholar enrichment (free, keyless; S2_API_KEY raises limits).
// Docs: https://api.semanticscholar.org
export interface S2Enrichment {
  tldr: string;
  cites: number;
  influentialCites: number;
}

export async function getPaperEnrichment(doi: string, apiKey?: string): Promise<S2Enrichment | null> {
  if (!doi) return null;
  const clean = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  try {
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/DOI:${clean}?fields=title,tldr,citationCount,influentialCitationCount`,
      {
        headers: apiKey ? { "x-api-key": apiKey } : {},
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!res.ok) return null;
    const j: any = await res.json();
    if (!j?.tldr?.text) return null;
    return {
      tldr: j.tldr.text,
      cites: j.citationCount ?? 0,
      influentialCites: j.influentialCitationCount ?? 0,
    };
  } catch {
    return null;
  }
}
