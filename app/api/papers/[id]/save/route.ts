import { NextRequest, NextResponse } from "next/server";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase-server";
import { db } from "@/lib/db";
import { idParamSchema } from "@/lib/validators";
import { apiError } from "@/lib/api-error";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isSupabaseConfigured()) return apiError("Auth not configured. Add Supabase keys.", 501);
  const parsed = idParamSchema.safeParse({ id: decodeURIComponent(params.id) });
  if (!parsed.success) return apiError("Invalid id", 400);
  const openalexShort = parsed.data.id;
  const { title } = await req.json().catch(() => ({}) as any);

  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiError("Sign in required", 401);

  try {
    const paper = await db.paper.upsert({
      where: { openalexId: `https://openalex.org/${openalexShort}` },
      update: {},
      create: {
        id: randomUUID(),
        openalexId: `https://openalex.org/${openalexShort}`,
        title: typeof title === "string" && title ? title.slice(0, 500) : openalexShort,
      },
    });
    await db.savedPaper.upsert({
      where: { userId_paperId: { userId: user.id, paperId: paper.id } },
      update: {},
      create: { userId: user.id, paperId: paper.id },
    });
    return NextResponse.json({ saved: true }, { status: 201 });
  } catch {
    return apiError();
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!isSupabaseConfigured()) return apiError("Auth not configured.", 501);
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiError("Sign in required", 401);
  try {
    const openalexShort = decodeURIComponent(params.id);
    const paper = await db.paper.findUnique({
      where: { openalexId: `https://openalex.org/${openalexShort}` },
    });
    if (paper) await db.savedPaper.deleteMany({ where: { userId: user.id, paperId: paper.id } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return apiError();
  }
}
