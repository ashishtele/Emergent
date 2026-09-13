import type { Metadata } from "next";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase-server";
import { db } from "@/lib/db";
import Link from "next/link";

export const metadata: Metadata = {
  title: "My Library",
  description: "Your saved papers and AI-guided reading paths.",
};

export default async function LibraryPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-3xl font-black tracking-tight">⭐ My Library</h1>
        <p className="text-sm">
          Auth not configured. Add Supabase keys, then{" "}
          <Link href="/login" className="underline">
            sign in
          </Link>
          .
        </p>
      </div>
    );
  }
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-3xl font-black tracking-tight">⭐ My Library</h1>
        <p className="text-sm">
          <Link href="/login" className="underline">
            Sign in
          </Link>{" "}
          to see saved papers.
        </p>
      </div>
    );
  }
  let saved: any[] = [];
  try {
    saved = await db.savedPaper.findMany({
      where: { userId: user.id },
      include: { paper: true },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return <p>Library temporarily unavailable (DB not migrated?). Run `npx prisma migrate dev`.</p>;
  }
  return (
    <div className="space-y-3">
      <h1 className="font-display text-3xl font-black tracking-tight">⭐ My Library</h1>
      {saved.length === 0 && <p className="text-sm text-ink/50 dark:text-paper/50">No saved papers yet.</p>}
      {saved.map((s) => (
        <div key={s.paperId} className="card !p-3 text-sm">
          {s.paper.title}
        </div>
      ))}
    </div>
  );
}
