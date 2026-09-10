import OpenAI from "openai";

// Provider-agnostic LLM client (OpenAI-compatible).
// OpenRouter (default): AI_BASE_URL=https://openrouter.ai/api/v1, AI_MODEL=<openrouter/free-model>
// Groq: AI_BASE_URL=https://api.groq.com/openai/v1
// Ollama (local): AI_BASE_URL=http://localhost:11434/v1, AI_API_KEY=ollama
export function aiConfig() {
  return {
    baseURL: process.env.AI_BASE_URL ?? "https://openrouter.ai/api/v1",
    apiKey: process.env.AI_API_KEY ?? "",
    model: process.env.AI_MODEL ?? "nvidia/nemotron-3-super-120b-a12b:free",
  };
}

export function isAiConfigured() {
  return Boolean(process.env.AI_API_KEY);
}

export function aiClient() {
  const { baseURL, apiKey, model } = aiConfig();
  const client = new OpenAI({
    baseURL,
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": "https://emergent-kohl.vercel.app",
      "X-Title": "Emergent",
    },
  });
  return { client, model };
}

export interface PathPaper {
  openalexId: string;
  title: string;
  year?: string;
  cited_by_count?: number;
}

export function readingPathPrompt(topic: string, papers: PathPaper[]): string {
  const list = papers
    .map(
      (p, i) =>
        `${i + 1}. "${p.title}" (${p.year ?? "n.d."}, cited by ${p.cited_by_count ?? 0}) [${p.openalexId}]`,
    )
    .join("\n");
  return [
    `You are a research guide. Topic: ${topic}.`,
    `From the candidate papers below, pick the 5 that form the best reading path ordered from foundational to cutting-edge.`,
    `Reply with JSON only: {"path":[{"openalexId":"...","why":"one sentence on why to read this and where it fits"}]}.`,
    `Only use papers from the list. Keep each "why" under 25 words.`,
    `Candidates:\n${list}`,
  ].join("\n");
}

export function parseReadingPath(raw: string, knownIds: Set<string>) {
  const parsed = JSON.parse(raw) as { path?: { openalexId?: string; why?: string }[] };
  if (!Array.isArray(parsed.path)) throw new Error("bad-ai-shape");
  const path = parsed.path
    .filter((s) => s && typeof s.openalexId === "string" && knownIds.has(s.openalexId))
    .slice(0, 5)
    .map((s) => ({ openalexId: s.openalexId as string, why: String(s.why ?? "").slice(0, 200) }));
  if (path.length === 0) throw new Error("bad-ai-shape");
  return path;
}

export function cacheKey(topic: string, model: string) {
  return `reading-path:v1:${model}:${topic.toLowerCase().trim()}`;
}
