const BASE = process.env.OPENALEX_BASE_URL ?? "https://api.openalex.org";

function authParams(): string {
  const key = process.env.OPENALEX_API_KEY;
  const mailto = process.env.OPENALEX_MAILTO;
  const p = new URLSearchParams();
  if (key) p.set("api_key", key);
  if (mailto && mailto.includes("@")) p.set("mailto", mailto);
  return p.toString();
}

export async function openAlex(path: string, params: Record<string, string> = {}, timeoutMs = 15000) {
  const qs = new URLSearchParams(params);
  const auth = authParams();
  const url = `${BASE}${path}?${qs.toString()}${auth ? `&${auth}` : ""}`;
  const res = await fetch(url, { next: { revalidate: 300 }, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`OpenAlex ${res.status} for ${path}`);
  return res.json();
}

export function decodeAbstract(inv?: Record<string, number[]> | null): string {
  if (!inv) return "";
  const entries: [string, number][] = [];
  for (const [word, pos] of Object.entries(inv)) for (const i of pos) entries.push([word, i]);
  return entries
    .sort((a, b) => a[1] - b[1])
    .map(([w]) => w)
    .join(" ");
}
