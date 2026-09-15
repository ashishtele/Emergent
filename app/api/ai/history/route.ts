import { NextResponse } from "next/server";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase-server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-error";
import { parseCacheKey, previewResponse } from "@/lib/history";

// GET /api/ai/history — recent shared AI runs (backed by AiCache until a
// dedicated AiRun table lands). Auth required; never exposes raw prompts.
export async function GET() {
  if (isSupabaseConfigured()) {
    const {
      data: { user },
    } = await supabaseServer().auth.getUser();
    if (!user) return apiError("Sign in required", 401);
  }
  try {
    const rows = await db.aiCache.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({
      runs: rows.map((r) => {
        const parsed = parseCacheKey(r.key);
        return {
          key: r.key,
          kind: parsed.kind,
          label: parsed.label,
          model: parsed.model,
          createdAt: r.createdAt,
          expiresAt: r.expiresAt,
          preview: previewResponse(r.response as unknown),
        };
      }),
    });
  } catch {
    return apiError();
  }
}
