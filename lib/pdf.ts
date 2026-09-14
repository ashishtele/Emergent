// Shared OA PDF resolution: Unpaywall → arXiv → OpenAlex best location.
export function resolvePdfUrl(work: any, unpaywallPdf?: string | null): string | null {
  if (unpaywallPdf) return unpaywallPdf;
  const arxivHit = JSON.stringify(work?.locations ?? []).match(/arxiv\.org\/(?:abs|pdf)\/([\d.]+)/i);
  if (arxivHit) return `https://arxiv.org/pdf/${arxivHit[1]}`;
  return work?.best_oa_location?.pdf_url ?? null;
}

export function extractArxivId(work: any): string | null {
  const hit = JSON.stringify(work?.locations ?? []).match(/arxiv\.org\/(?:abs|pdf)\/([\d.]+)/i);
  return hit ? hit[1] : null;
}
