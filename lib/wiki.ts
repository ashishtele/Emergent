// Wikipedia article summaries for topic pages (free, no key).
// Docs: https://en.wikipedia.org/api/rest_v1
export async function getTopicSummary(title: string): Promise<string | null> {
  if (!title) return null;
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      {
        headers: { "User-Agent": "Emergent/0.1 (research discovery)" },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!res.ok) return null;
    const j: any = await res.json();
    if (j?.type === "disambiguation" || !j?.extract) return null;
    return j.extract as string;
  } catch {
    return null;
  }
}
