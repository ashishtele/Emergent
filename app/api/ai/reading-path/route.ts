import { NextRequest, NextResponse } from "next/server";
import { openAlex } from "@/lib/openalex";
import {
  aiClient,
  isAiConfigured,
  readingPathPrompt,
  parseReadingPath,
  cacheKey,
  type PathPaper,
} from "@/lib/ai";
import { readingPathSchema } from "@/lib/validators";
import { apiError, badRequest } from "@/lib/api-error";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase-server";
import { db } from "@/lib/db";

const TTL_DAYS = 7;

export async function POST(req: NextRequest) {
  if (!isAiConfigured()) return apiError("AI is not configured. Add AI_API_KEY.", 501);
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
  const key = cacheKey(topic, model);
  try {
    const hit = await db.aiCache.findUnique({ where: { key } });
    if (hit && hit.expiresAt > new Date()) {
      return NextResponse.json({ topic, cached: true, path: hit.response });
    }
  } catch {
    /* cache miss is non-fatal */
  }

  try {
    const params: Record<string, string> = { search: topic, sort: "cited_by_count:desc", "per-page": "12" };
    if (topicId) params.filter = `topics.id:${topicId}`;
    const d: any = await openAlex("/works", params);
    const papers: PathPaper[] = (d.results ?? []).slice(0, 12).map((w: any) => ({
      openalexId: String(w.id).split("/").pop(),
      title: w.title,
      year: w.publication_year ? String(w.publication_year) : w.publication_date?.slice(0, 4),
      cited_by_count: w.cited_by_count,
    }));
    if (papers.length === 0) return apiError("No papers found for this topic", 404);

    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: readingPathPrompt(topic, papers) }],
      temperature: 0.3,
      max_tokens: 600,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const path = parseReadingPath(raw, new Set(papers.map((p) => p.openalexId)));
    const byId = new Map(papers.map((p) => [p.openalexId, p]));
    const enriched = path.map((s) => ({ ...s, ...byId.get(s.openalexId) }));

    try {
      await db.aiCache.upsert({
        where: { key },
        update: { response: enriched, expiresAt: new Date(Date.now() + TTL_DAYS * 864e5) },
        create: { key, response: enriched, expiresAt: new Date(Date.now() + TTL_DAYS * 864e5) },
      });
    } catch {
      /* cache write is non-fatal */
    }

    return NextResponse.json({ topic, cached: false, path: enriched });
  } catch (e: any) {
    if (e?.message === "bad-ai-shape") return apiError("AI returned an unusable answer. Try again.", 502);
    return apiError();
  }
}
