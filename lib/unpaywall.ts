// Unpaywall OA locations (free, email-based like OpenAlex).
// Docs: https://unpaywall.org/products/api
export interface OaLocations {
  pdfUrl: string | null;
  landingUrl: string | null;
}

export async function getOaLocations(doi: string, email?: string): Promise<OaLocations | null> {
  if (!doi) return null;
  const clean = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  try {
    const res = await fetch(
      `https://api.unpaywall.org/v2/${clean}?email=${encodeURIComponent(email ?? "emergent@example.com")}`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) return null;
    const j: any = await res.json();
    if (!j?.is_oa) return null;
    const loc = j.best_oa_location ?? {};
    if (!loc.url_for_pdf && !loc.url) return null;
    return { pdfUrl: loc.url_for_pdf ?? null, landingUrl: loc.url ?? null };
  } catch {
    return null;
  }
}
