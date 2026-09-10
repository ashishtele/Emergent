import { NextResponse } from "next/server";
import { openAlex } from "@/lib/openalex";
import { yearCounts, rankTrending } from "@/lib/trends";
import { apiError } from "@/lib/api-error";

export const revalidate = 3600;

const TERMS = [
  "AI Agents",
  "Multimodal AI",
  "Retrieval-Augmented Generation",
  "AI Safety",
  "Robotics",
  "Quantum Computing",
];
const PREV = 2024,
  CUR = 2025;

export async function GET() {
  try {
    const raw = await Promise.all(
      TERMS.map(async (term) => {
        try {
          const d: any = await openAlex("/works", {
            search: term,
            group_by: "publication_year",
            "per-page": "50",
          });
          const byYear = yearCounts(d.group_by);
          const prev = byYear.get(PREV) ?? 0;
          const cur = byYear.get(CUR) ?? 0;
          return { term, prev, cur };
        } catch {
          return { term, prev: 0, cur: 0 };
        }
      }),
    );
    const items = rankTrending(raw);
    return NextResponse.json({ prev_year: PREV, cur_year: CUR, trending: items });
  } catch {
    return apiError();
  }
}
