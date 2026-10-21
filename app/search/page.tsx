import type { Metadata } from "next";
import SearchClient from "@/components/SearchClient";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const q = sp.q?.trim();
  if (!q) return { title: "Search", description: "Search millions of papers, researchers and topics." };
  const type = sp.type ?? "works";
  const label = type === "works" ? "papers" : type;
  return {
    title: `Results for “${q.length > 60 ? `${q.slice(0, 60)}…` : q}”`,
    description: `Search ${label} matching “${q}” across OpenAlex research data.`,
  };
}

export default function SearchPage() {
  return <SearchClient />;
}
