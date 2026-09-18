import { TypeSafeClient, choice, score, noul } from "@typesafe-ai/sdk";
import { decodeAbstract } from "./openalex";

// Jev-safe decision layer: TypeSafe Jev is an optional enhancer, never a hard
// dependency. If TYPESAFE_API_KEY is missing, JEV_ENABLED=false, or the call
// fails/times out, callers get a deterministic heuristic ranking instead.
// Cached Jev decisions in AiCache survive key loss.

export interface JevPaper {
  openalexId: string;
  title: string;
  abstract?: string;
  year?: string;
  cited_by_count?: number;
}

export interface RankedPaper extends JevPaper {
  relevance: number;
  emergence: number;
  rigor: number;
  level: string;
  confidence: number;
  composite: number;
}

export type RankSource = "jev" | "heuristic" | "cache";

export function isJevConfigured(): boolean {
  if (process.env.JEV_ENABLED === "false") return false;
  return Boolean(process.env.TYPESAFE_API_KEY);
}

export function jevModel(): string {
  return process.env.JEV_MODEL ?? "jev-latest";
}

export function jevCacheKey(query: string, model: string): string {
  return `jev-rank:v1:${model}:${query.toLowerCase().trim()}`;
}

// Composite: 0.5 relevance (0-1) + 0.3 emergence_norm (0-4 -> 0-1) + 0.2 rigor_norm.
export function compositeScore(relevance: number, emergence: number, rigor: number): number {
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  const e = clamp01(emergence / 3);
  const r = clamp01(rigor / 3);
  return Math.round((0.5 * clamp01(relevance) + 0.3 * e + 0.2 * r) * 1000) / 1000;
}

// Deterministic fallback: keyword overlap + cites + recency. No network, no keys.
export function heuristicRank(query: string, papers: JevPaper[]): RankedPaper[] {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
  const yearNow = new Date().getFullYear();
  return papers
    .map((p) => {
      const hay = `${p.title ?? ""} ${p.abstract ?? ""}`.toLowerCase();
      const hits = terms.length === 0 ? 0 : terms.filter((t) => hay.includes(t)).length / terms.length;
      const cites = Math.min(1, Math.log10((p.cited_by_count ?? 0) + 1) / 4);
      const y = parseInt(p.year ?? "", 10);
      const recency = Number.isFinite(y) ? Math.min(1, Math.max(0, 1 - (yearNow - y) / 20)) : 0.3;
      const relevance = Math.round((0.6 * hits + 0.25 * cites + 0.15 * recency) * 1000) / 1000;
      const emergence = recency > 0.7 ? 2 : recency > 0.4 ? 1 : 0;
      const rigor = cites > 0.5 ? 2 : cites > 0.2 ? 1 : 0;
      return {
        ...p,
        relevance,
        emergence,
        rigor,
        level: emergence >= 2 ? "cutting_edge" : "foundational",
        confidence: 0.4,
        composite: compositeScore(relevance, emergence, rigor),
      };
    })
    .sort((a, b) => b.composite - a.composite);
}

export function buildJevQuestions(query: string) {
  return {
    relevance: noul(`Does this paper directly answer the query "${query}"?`, {
      true: "Paper is directly on the query topic",
      false: "Paper is only tangentially related or off-topic",
    }),
    emergence: score("How emerging is this work?", [
      "Established textbook knowledge",
      "Incremental improvement",
      "Emerging approach gaining traction",
      "Breakthrough or novel direction",
    ]),
    rigor: score("How strong is the evidence?", [
      "Claim without validation",
      "Observational or single experiment",
      "Controlled study with validation",
      "Replicated or meta-validated",
    ]),
    level: choice("Best reading-path position?", {
      foundational: "Foundational background to read first",
      methods: "Methods or technique paper",
      cutting_edge: "Cutting-edge recent advance",
      exclude: "Off-topic or too weak to include",
    }),
  };
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("jev-timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

// Live Jev call. Throws on any failure — callers must catch and fall back.
export async function jevRankLive(query: string, papers: JevPaper[]): Promise<RankedPaper[]> {
  const client = new TypeSafeClient({ timeout: 8000 });
  const model = jevModel();
  const out: RankedPaper[] = [];
  for (const p of papers.slice(0, 20)) {
    const res = await withTimeout(
      client.systemOne(
        {
          state: {
            query,
            title: p.title,
            abstract: p.abstract ?? "",
            year: p.year ?? "",
            cited_by_count: p.cited_by_count ?? 0,
          },
          questions: buildJevQuestions(query),
          model,
        },
        { timeout: 8000, retry: { maxRetries: 1 } },
      ),
      10000,
    );
    const a = res.answers as any;
    const relevance: number = a.relevance?.noul ?? 0;
    const emergence: number = a.emergence?.score ?? 0;
    const rigor: number = a.rigor?.score ?? 0;
    const level: string = a.level?.choice ?? "foundational";
    const confidence: number = Math.min(
      1,
      Math.max(0, ((a.level?.confidence ?? 0.5) + (a.emergence?.confidence ?? 0.5)) / 2),
    );
    out.push({
      ...p,
      relevance: Math.round(relevance * 1000) / 1000,
      emergence: Math.round(emergence * 100) / 100,
      rigor: Math.round(rigor * 100) / 100,
      level,
      confidence: Math.round(confidence * 1000) / 1000,
      composite: compositeScore(relevance, emergence, rigor),
    });
  }
  return out.filter((p) => p.level !== "exclude").sort((a, b) => b.composite - a.composite);
}

// Map OpenAlex /works results to JevPaper inputs (best-effort, pure).
export function toJevPapers(results: any[]): JevPaper[] {
  return (results ?? []).map((w: any) => {
    const id =
      String(w.id ?? w.openalexId ?? "")
        .split("/")
        .pop() ?? "";
    const year =
      w.publication_year != null
        ? String(w.publication_year)
        : typeof w.publication_date === "string"
          ? w.publication_date.slice(0, 4)
          : typeof w.year === "string"
            ? w.year
            : undefined;
    return {
      openalexId: id,
      title: String(w.title ?? w.display_name ?? id),
      abstract: decodeAbstract(w.abstract_inverted_index)?.slice(0, 2000) || undefined,
      year,
      cited_by_count: typeof w.cited_by_count === "number" ? w.cited_by_count : undefined,
    };
  });
}

// Reorder raw OpenAlex results by ranked order; leftovers keep original order.
export function reorderByRank<T extends { id?: string; openalexId?: string }>(
  results: T[],
  ranked: { openalexId: string }[],
): T[] {
  const short = (v: unknown) =>
    String(v ?? "")
      .split("/")
      .pop()
      ?.toUpperCase();
  const byId = new Map(results.map((r) => [short((r as any).id ?? (r as any).openalexId), r]));
  const ordered: T[] = [];
  for (const r of ranked) {
    const hit = byId.get(short(r.openalexId));
    if (hit) {
      ordered.push(hit);
      byId.delete(short(r.openalexId));
    }
  }
  for (const r of results) {
    const k = short((r as any).id ?? (r as any).openalexId);
    if (byId.has(k)) {
      ordered.push(r);
      byId.delete(k);
    }
  }
  return ordered;
}

// Order a ranked shortlist for a reading path: foundational first,
// methods next, cutting-edge last; composite breaks ties within a level.
const LEVEL_ORDER = ["foundational", "methods", "cutting_edge"];

export function orderForReadingPath(ranked: RankedPaper[]): RankedPaper[] {
  const levelRank = (level: string) => {
    const i = LEVEL_ORDER.indexOf(level);
    return i === -1 ? LEVEL_ORDER.length : i;
  };
  return [...ranked].sort((a, b) => levelRank(a.level) - levelRank(b.level) || b.composite - a.composite);
}

// Main entry: Jev when possible, heuristic otherwise. Never throws for missing
// key — only for DB misuse (cache is best-effort in the route, not here).
export async function rankPapers(
  query: string,
  papers: JevPaper[],
): Promise<{ source: Exclude<RankSource, "cache">; ranked: RankedPaper[] }> {
  if (!isJevConfigured() || papers.length === 0) {
    return { source: "heuristic", ranked: heuristicRank(query, papers) };
  }
  try {
    const ranked = await jevRankLive(query, papers);
    if (ranked.length === 0) return { source: "heuristic", ranked: heuristicRank(query, papers) };
    return { source: "jev", ranked };
  } catch (e) {
    console.warn("jev failed, heuristic fallback:", (e as Error)?.message ?? e);
    return { source: "heuristic", ranked: heuristicRank(query, papers) };
  }
}
