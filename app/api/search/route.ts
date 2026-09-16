import { NextRequest, NextResponse } from "next/server";
import { openAlex } from "@/lib/openalex";
import { searchQuerySchema } from "@/lib/validators";
import { apiError, badRequest } from "@/lib/api-error";
import { rankPapers, toJevPapers, reorderByRank } from "@/lib/jev";

export async function GET(req: NextRequest) {
  const parsed = searchQuerySchema.safeParse({
    q: req.nextUrl.searchParams.get("q")?.trim(),
    type: req.nextUrl.searchParams.get("type") ?? "works",
    page: req.nextUrl.searchParams.get("page") ?? "1",
    oa: req.nextUrl.searchParams.get("oa") ?? undefined,
    rerank: req.nextUrl.searchParams.get("rerank") ?? undefined,
  });
  if (!parsed.success) return badRequest("Invalid ?q= (1-200 chars), ?type=, ?page=");
  const { q, type, page, oa, rerank } = parsed.data;
  try {
    let data;
    const per = "10";
    const pg = String(page);
    if (type === "authors") data = await openAlex("/authors", { search: q, "per-page": per, page: pg });
    else if (type === "institutions")
      data = await openAlex("/institutions", { search: q, "per-page": per, page: pg });
    else if (type === "topics") data = await openAlex("/topics", { search: q, "per-page": per, page: pg });
    else {
      const params: Record<string, string> = { search: q, "per-page": per, page: pg };
      if (oa) params.filter = "is_oa:true";
      data = await openAlex("/works", params);
      if (rerank && Array.isArray((data as any)?.results) && (data as any).results.length > 0) {
        try {
          const papers = toJevPapers((data as any).results);
          const { source, ranked } = await rankPapers(q, papers);
          (data as any).results = reorderByRank((data as any).results, ranked);
          (data as any).ranking = source;
        } catch {
          /* rerank is best-effort; return OpenAlex order */
        }
      }
    }
    return NextResponse.json(data);
  } catch {
    return apiError();
  }
}
