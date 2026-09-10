import { NextRequest, NextResponse } from "next/server";
import { openAlex, decodeAbstract } from "@/lib/openalex";
import { idParamSchema } from "@/lib/validators";
import { apiError, badRequest } from "@/lib/api-error";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = idParamSchema.safeParse({ id: decodeURIComponent(params.id) });
  if (!parsed.success) return badRequest("Invalid id");
  const id = parsed.data.id;
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
    return apiError();
  }
}
