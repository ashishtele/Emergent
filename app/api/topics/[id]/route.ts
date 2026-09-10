import { NextRequest, NextResponse } from "next/server";
import { openAlex } from "@/lib/openalex";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  if (!id || id.length > 100) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
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
    return NextResponse.json(
      { error: "Research data is temporarily unavailable. Please try again in a moment." },
      { status: 503 },
    );
  }
}
