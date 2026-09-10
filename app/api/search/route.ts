import { NextRequest, NextResponse } from "next/server";
import { openAlex } from "@/lib/openalex";
import { searchQuerySchema } from "@/lib/validators";
import { apiError, badRequest } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  const parsed = searchQuerySchema.safeParse({
    q: req.nextUrl.searchParams.get("q")?.trim(),
    type: req.nextUrl.searchParams.get("type") ?? "works",
    page: req.nextUrl.searchParams.get("page") ?? "1",
    oa: req.nextUrl.searchParams.get("oa") ?? undefined,
  });
  if (!parsed.success) return badRequest("Invalid ?q= (1-200 chars), ?type=, ?page=");
  const { q, type, page, oa } = parsed.data;
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
    }
    return NextResponse.json(data);
  } catch {
    return apiError();
  }
}
