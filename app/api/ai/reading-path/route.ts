import { NextRequest, NextResponse } from "next/server";
import { openAlex } from "@/lib/openalex";
import {
  aiClient,
  isAiConfigured,
  readingWhyPrompt,
  parseReadingPath,
  cacheKey,
  chatWithRetry,
  type PathPaper,
} from "@/lib/ai";
import { rankPapers, toJevPapers, orderForReadingPath, jevModel, isJevConfigured } from "@/lib/jev";
import { readingPathSchema } from "@/lib/validators";
import { apiError, badRequest } from "@/lib/api-error";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase-server";
import { db } from "@/lib/db";

const TTL_DAYS = 7;

// POST /api/ai/reading-path — Jev selects + orders 5 papers, the LLM only
// writes one "why" sentence each. Selection works without any AI key
// (heuristic fallback); prose needs AI_API_KEY and degrades to empty "why".
export async function POST(req: NextRequest) {
  const parsed = readingPathSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest("Invalid {topic}");
  const { topic, topicId } = parsed.data;

  if (isSupabaseConfigured()) {
    const {
      data: { user },
    } = await supabaseServer().auth.getUser();
    if (!user) return apiError("Sign in required", 401);
  }

  const { client, model } = aiClient();
  const key = `${cacheKey(topic, model)}:${isJevConfigured() ? jevModel() : "heuristic"}`;
  try {
    const hit = await db.aiCache.findUnique({ where: { key } });
    if (hit && hit.expiresAt > new Date()) {
      return NextResponse.json({ topic, cached: true, ranking: "cache", path: hit.response });
    }
  } catch {
    /* cache miss is non-fatal */
  }

  try {
    const params: Record<string, string> = { search: topic, sort: "cited_by_count:desc", "per-page": "12" };
    if (topicId) params.filter = `topics.id:${topicId}`;
    const d: any = await openAlex("/works", params);
    const results: any[] = d.results ?? [];
    if (results.length === 0) return apiError("No papers found for this topic", 404);

    const meta = new Map<string, PathPaper>(
      results.map((w: any) => {
        const openalexId = String(w.id).split("/").pop() ?? "";
        return [
          openalexId,
          {
            openalexId,
            title: w.title,
            year: w.publication_year ? String(w.publication_year) : w.publication_date?.slice(0, 4),
            cited_by_count: w.cited_by_count,
          },
        ];
      }),
    );

    const { source, ranked } = await rankPapers(topic, toJevPapers(results));
    const selected = orderForReadingPath(ranked).slice(0, 5);
    if (selected.length === 0) return apiError("No suitable papers found for this topic", 404);

    const whys = new Map<string, string>(selected.map((s) => [s.openalexId, ""]));
    let prose = false;
    if (isAiConfigured()) {
      try {
        const ordered: PathPaper[] = selected.map((s) => meta.get(s.openalexId) ?? s);
        const raw = await chatWithRetry(() =>
          client.chat.completions
            .create({
              model,
              messages: [{ role: "user", content: readingWhyPrompt(topic, ordered) }],
              temperature: 0.3,
              max_tokens: 800,
              response_format: { type: "json_object" },
            })
            .then((c) => c.choices[0]?.message?.content ?? ""),
        );
        const path = parseReadingPath(raw, new Set(ordered.map((p) => p.openalexId)));
        for (const s of path) whys.set(s.openalexId, s.why);
        prose = true;
      } catch (e: any) {
        console.error("reading-path prose fallback:", e?.message ?? e);
      }
    }

    const enriched = selected.map((s) => ({
      ...(meta.get(s.openalexId) ?? { openalexId: s.openalexId, title: s.title }),
      why: whys.get(s.openalexId) ?? "",
      level: s.level,
    }));
    const json = JSON.parse(JSON.stringify(enriched));

    try {
      await db.aiCache.upsert({
        where: { key },
        update: { response: json, expiresAt: new Date(Date.now() + TTL_DAYS * 864e5) },
        create: { key, response: json, expiresAt: new Date(Date.now() + TTL_DAYS * 864e5) },
      });
    } catch {
      /* cache write is non-fatal */
    }

    return NextResponse.json({ topic, cached: false, ranking: source, prose, path: enriched });
  } catch {
    return apiError();
  }
}
