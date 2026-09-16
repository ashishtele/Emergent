import { NextRequest, NextResponse } from "next/server";
import { rankPapers, jevCacheKey, jevModel, isJevConfigured, type JevPaper } from "@/lib/jev";
import { rankSchema } from "@/lib/validators";
import { apiError, badRequest } from "@/lib/api-error";
import { db } from "@/lib/db";

const TTL_DAYS = 7;

// POST /api/ai/rank — Jev-safe semantic rerank.
// Body: { query, papers: [{ openalexId, title, abstract?, year?, cited_by_count? }] }
// Always succeeds without a key via heuristic fallback; Jev enhances when configured.
export async function POST(req: NextRequest) {
  const parsed = rankSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest("Invalid {query, papers[1..20]}");
  const { query, papers } = parsed.data as { query: string; papers: JevPaper[] };

  const model = jevModel();
  const key = jevCacheKey(query, isJevConfigured() ? model : "heuristic");

  try {
    const hit = await db.aiCache.findUnique({ where: { key } });
    if (hit && hit.expiresAt > new Date()) {
      return NextResponse.json({ query, cached: true, ranking: "cache", ranked: hit.response });
    }
  } catch {
    /* cache miss is non-fatal */
  }

  try {
    const { source, ranked } = await rankPapers(query, papers);
    const json = JSON.parse(JSON.stringify(ranked));
    try {
      await db.aiCache.upsert({
        where: { key },
        update: { response: json, expiresAt: new Date(Date.now() + TTL_DAYS * 864e5) },
        create: { key, response: json, expiresAt: new Date(Date.now() + TTL_DAYS * 864e5) },
      });
    } catch {
      /* cache write is non-fatal */
    }
    return NextResponse.json({ query, cached: false, ranking: source, ranked });
  } catch {
    return apiError();
  }
}
