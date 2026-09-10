import { NextRequest, NextResponse } from "next/server";
import { openAlex } from "@/lib/openalex";
import { idParamSchema } from "@/lib/validators";
import { apiError, badRequest } from "@/lib/api-error";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = idParamSchema.safeParse({ id: decodeURIComponent(params.id) });
  if (!parsed.success) return badRequest("Invalid id");
  const id = parsed.data.id;
  try {
    const i: any = await openAlex(`/institutions/${encodeURIComponent(id)}`);
    const instId = i.id?.split("/").pop() ?? id;
    const works = await openAlex("/works", {
      filter: `authorships.institutions.id:${instId}`,
      sort: "cited_by_count:desc",
      "per-page": "5",
    });
    return NextResponse.json({
      id: i.id,
      name: i.display_name,
      country: i.country_code,
      type: i.type,
      works_count: i.works_count,
      cited_by_count: i.cited_by_count,
      topics: (i.topics ?? []).slice(0, 8).map((t: any) => ({ id: t.id, name: t.display_name })),
      topWorks: (works.results ?? []).map((w: any) => ({
        id: w.id,
        title: w.title,
        cited_by_count: w.cited_by_count,
      })),
    });
  } catch {
    return apiError();
  }
}
