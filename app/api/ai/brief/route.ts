import { NextRequest, NextResponse } from "next/server";
import { openAlex, decodeAbstract } from "@/lib/openalex";
import { getOaLocations } from "@/lib/unpaywall";
import { fetchFullText, briefPrompt, briefCacheKey } from "@/lib/jina";
import { aiClient, isAiConfigured, chatWithRetry, classifyAiError } from "@/lib/ai";
import { briefSchema } from "@/lib/validators";
import { apiError, badRequest } from "@/lib/api-error";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase-server";
import { db } from "@/lib/db";

const TTL_DAYS = 30;

function sourceUrl(w: any, oa: { pdfUrl: string | null; landingUrl: string | null } | null): string | null {
  return oa?.pdfUrl ?? w.best_oa_location?.url_for_pdf ?? w.best_oa_location?.url ?? w.doi ?? null;
}

export async function POST(req: NextRequest) {
  if (!isAiConfigured()) return apiError("AI is not configured. Add AI_API_KEY.", 501);
  const parsed = briefSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest("Invalid {openalexId} or {pdfUrl, title}");
  const data = parsed.data;

  if (isSupabaseConfigured()) {
    const {
      data: { user },
    } = await supabaseServer().auth.getUser();
    if (!user) return apiError("Sign in required", 401);
  }

  const { client, model } = aiClient();
  const workKey = "openalexId" in data ? `https://openalex.org/${data.openalexId}` : data.pdfUrl;
  const key = briefCacheKey(workKey, model);
  try {
    const hit = await db.aiCache.findUnique({ where: { key } });
    if (hit && hit.expiresAt > new Date()) {
      const cached = hit.response as any;
      const brief = typeof cached === "string" ? cached : cached?.brief;
      if (brief) {
        return NextResponse.json({
          cached: true,
          brief,
          fullText: typeof cached === "object" ? Boolean(cached?.fullText) : false,
        });
      }
    }
  } catch {
    /* cache miss is non-fatal */
  }

  try {
    let title: string;
    let input: string | null;
    let fullText: string | null;
    if ("openalexId" in data) {
      const w: any = await openAlex(`/works/${encodeURIComponent(data.openalexId)}`);
      title = w.title ?? data.openalexId;
      const oa = w.doi
        ? await getOaLocations(w.doi, process.env.UNPAYWALL_EMAIL ?? process.env.OPENALEX_MAILTO)
        : null;
      const url = sourceUrl(w, oa);
      fullText = url ? await fetchFullText(url, process.env.JINA_API_KEY) : null;
      input = fullText ?? decodeAbstract(w.abstract_inverted_index);
    } else {
      title = data.title;
      fullText = await fetchFullText(data.pdfUrl, process.env.JINA_API_KEY);
      input = fullText;
    }
    if (!input) return apiError("No readable text for this paper", 404);

    const brief = await chatWithRetry(() =>
      client.chat.completions
        .create({
          model,
          messages: [{ role: "user", content: briefPrompt(title, fullText ?? input) }],
          temperature: 0.3,
          max_tokens: 500,
        })
        .then((c) => (c.choices[0]?.message?.content ?? "").trim()),
    );
    if (!brief) return apiError("AI returned an empty brief. Try again.", 502);

    try {
      await db.aiCache.upsert({
        where: { key },
        update: {
          response: { brief, fullText: Boolean(fullText) },
          expiresAt: new Date(Date.now() + TTL_DAYS * 864e5),
        },
        create: {
          key,
          response: { brief, fullText: Boolean(fullText) },
          expiresAt: new Date(Date.now() + TTL_DAYS * 864e5),
        },
      });
    } catch {
      /* cache write is non-fatal */
    }

    return NextResponse.json({ cached: false, brief, fullText: Boolean(fullText) });
  } catch (e: any) {
    console.error("brief failed:", e?.status ?? e?.message ?? e);
    if (classifyAiError(e) === "busy")
      return apiError("AI provider is busy right now. Try again in a minute.", 502);
    return apiError();
  }
}
