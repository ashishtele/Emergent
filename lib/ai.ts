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

// Maps upstream LLM failures to user-facing handling.
// Returns "busy" for transient overload/rate-limit (worth one retry + friendly message).
export function classifyAiError(e: any): "busy" | "fatal" {
  const status = e?.status ?? e?.response?.status;
  if (status === 429 || status === 502 || status === 503 || status === 529) return "busy";
  return "fatal";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// One retry with backoff for transient provider overload.
export async function chatWithRetry(call: () => Promise<string>, retries = 1): Promise<string> {
  try {
    return await call();
  } catch (e) {
    if (retries > 0 && classifyAiError(e) === "busy") {
      await sleep(2000);
      return call();
    }
    throw e;
  }
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
    `Reply with a single JSON object and nothing else: no preamble, no explanation, no thinking out loud. It must have one key, "path", whose value is an array of exactly 5 items in reading order.`,
    `Each item has two string fields: "openalexId" copied exactly from the candidate list, and "why", one sentence under 25 words on why to read it and where it fits.`,
    `Candidates:\n${list}`,
  ].join("\n");
}

// Free-tier models often echo instructions (including any example JSON) before
// answering. Collect every top-level balanced {...} block so callers can prefer
// the LAST one — the actual answer — over echoed prompt text.
export function extractJsonBlocks(raw: string): string[] {
  const blocks: string[] = [];
  let depth = 0;
  let start = -1;
  let inStr = false;
  let esc = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        blocks.push(raw.slice(start, i + 1));
        start = -1;
      }
      if (depth < 0) depth = 0;
    }
  }
  return blocks;
}

// Some providers ignore response_format and wrap JSON in prose.
// Extract the largest {...} block before parsing.
export function extractJson(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("bad-ai-shape");
  return raw.slice(start, end + 1);
}

export function parseReadingPath(raw: string, knownIds: Set<string>) {
  const known = new Set(Array.from(knownIds).map((id) => normId(id) ?? id));
  // Try blocks last-first: echoed prompt text comes before the real answer.
  const blocks = extractJsonBlocks(raw);
  if (blocks.length === 0) throw new Error("bad-ai-shape");
  for (let i = blocks.length - 1; i >= 0; i--) {
    let parsed: { path?: Record<string, unknown>[] };
    try {
      parsed = JSON.parse(blocks[i]);
    } catch {
      continue;
    }
    if (!Array.isArray(parsed.path)) continue;
    const path = parsed.path
      .map((s) => {
        if (!s || typeof s !== "object") return null;
        const id = normId(s.openalexId ?? s.id);
        const why = String(s.why ?? s.reason ?? s.explanation ?? "").slice(0, 200);
        return id && known.has(id) ? { openalexId: id, why } : null;
      })
      .filter((s): s is { openalexId: string; why: string } => s !== null)
      .slice(0, 5);
    if (path.length > 0) return path;
  }
  throw new Error("bad-ai-shape");
}

// Accepts short ids (W123), full OpenAlex URLs, any casing.
export function normId(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const m = v.trim().match(/(W\d+)\/?$/i);
  return m ? m[1].toUpperCase() : null;
}

export function cacheKey(topic: string, model: string) {
  return `reading-path:v1:${model}:${topic.toLowerCase().trim()}`;
}
