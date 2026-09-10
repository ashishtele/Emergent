import { NextRequest, NextResponse } from "next/server";
import { openAlex } from "@/lib/openalex";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  if (!id || id.length > 100) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const a: any = await openAlex(`/authors/${encodeURIComponent(id)}`);
    const authorId = a.id?.split("/").pop() ?? id;
    const works = await openAlex("/works", {
      filter: `author.id:${authorId}`,
      sort: "cited_by_count:desc",
      "per-page": "5",
    });
    return NextResponse.json({
      id: a.id,
      name: a.display_name,
      orcid: a.orcid,
      institution: a.last_known_institutions?.[0]?.display_name ?? null,
      works_count: a.works_count,
      cited_by_count: a.cited_by_count,
      topics: (a.topics ?? []).slice(0, 8).map((t: any) => ({ id: t.id, name: t.display_name })),
      topWorks: (works.results ?? []).map((w: any) => ({
        id: w.id,
        title: w.title,
        cited_by_count: w.cited_by_count,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Research data is temporarily unavailable." }, { status: 503 });
  }
}
