import { createHash } from "node:crypto";

// Jina Reader: URL -> clean markdown (free tier keyless, key raises limits).
// Docs: https://jina.ai/reader
const MIN_CHARS = 500;
const MAX_CHARS = 12000;

export async function fetchFullText(url: string, apiKey?: string): Promise<string | null> {
  if (!url) return null;
  try {
    const target = url.startsWith("http") ? url : `https://${url}`;
    const res = await fetch(`https://r.jina.ai/${target}`, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    if (text.length < MIN_CHARS) return null;
    return text.slice(0, MAX_CHARS);
  } catch {
    return null;
  }
}

export function briefPrompt(title: string, fullText: string): string {
  return [
    `You are a research guide. Summarize the paper "${title}" for a busy researcher in under 150 words.`,
    `Reply in markdown with exactly these sections: ## Problem, ## Method, ## Result, ## Limitation.`,
    `One or two sentences per section. No preamble, no extra sections.`,
    `Paper text:\n${fullText}`,
  ].join("\n");
}

export function briefCacheKey(url: string, model: string) {
  const hash = createHash("sha256").update(url.toLowerCase()).digest("hex").slice(0, 16);
  return `brief:v1:${model}:${hash}`;
}
