import { NextRequest, NextResponse } from "next/server";
import { openAlex, decodeAbstract } from "@/lib/openalex";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  if (!id || id.length > 100) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const w: any = await openAlex(`/works/${encodeURIComponent(id)}`);
    return NextResponse.json({
      id: w.id,
      title: w.title,
      abstract: decodeAbstract(w.abstract_inverted_index),
      publication_date: w.publication_date,
      doi: w.doi,
      open_access: w.open_access,
      cited_by_count: w.cited_by_count,
      authors: (w.authorships ?? []).map((a: any) => ({
        id: a.author?.id,
        name: a.author?.display_name,
        institution: a.institutions?.[0]?.display_name ?? null,
      })),
      topics: (w.topics ?? []).map((t: any) => ({ id: t.id, name: t.display_name })),
      referenced_works: (w.referenced_works ?? []).slice(0, 10),
      related_works: (w.related_works ?? []).slice(0, 10),
    });
  } catch {
    return NextResponse.json(
      { error: "Research data is temporarily unavailable. Please try again in a moment." },
      { status: 503 },
    );
  }
}
