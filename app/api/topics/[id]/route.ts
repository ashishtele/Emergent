import { NextRequest, NextResponse } from "next/server";
import { openAlex } from "@/lib/openalex";
import { idParamSchema } from "@/lib/validators";
import { apiError, badRequest } from "@/lib/api-error";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = idParamSchema.safeParse({ id: decodeURIComponent(params.id) });
  if (!parsed.success) return badRequest("Invalid id");
  const id = parsed.data.id;
  try {
    const topic: any = await openAlex(`/topics/${encodeURIComponent(id)}`);
    const topicId = topic.id?.split("/").pop() ?? id;
    const [topWorks, activity] = await Promise.all([
      openAlex("/works", { filter: `topics.id:${topicId}`, sort: "cited_by_count:desc", "per-page": "5" }),
      openAlex("/works", { filter: `topics.id:${topicId}`, group_by: "publication_year", "per-page": "50" }),
    ]);
    return NextResponse.json({
      id: topic.id,
      name: topic.display_name,
      description: topic.description,
      field: topic.field?.display_name,
      domain: topic.domain?.display_name,
      works_count: topic.works_count,
      subfields: topic.subfields ?? [],
      related: (topic.related_topics ?? []).slice(0, 8).map((t: any) => ({ id: t.id, name: t.display_name })),
      topWorks: (topWorks.results ?? []).map((w: any) => ({
        id: w.id,
        title: w.title,
        cited_by_count: w.cited_by_count,
      })),
      activity: (activity.group_by ?? [])
        .map((g: any) => ({ year: g.key, count: g.count }))
        .sort((a: any, b: any) => a.year - b.year)
        .slice(-8),
    });
  } catch {
    return apiError();
  }
}
