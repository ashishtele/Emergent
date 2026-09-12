import dynamic from "next/dynamic";
import Link from "next/link";
import { openAlex } from "@/lib/openalex";

const InstitutionsGlobe = dynamic(() => import("@/components/InstitutionsGlobe"), { ssr: false });

function shortId(u: string) {
  return u?.split("/").pop() ?? u;
}

export default async function InstitutionsPage() {
  let institutions: any[] = [];
  try {
    const d: any = await openAlex("/institutions", {
      sort: "works_count:desc",
      "per-page": "12",
    });
    institutions = d.results ?? [];
  } catch {
    return <p>Research data is temporarily unavailable. Please try again in a moment.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-accent">Map</p>
        <h1 className="font-display text-4xl font-black tracking-tight">Institutions Globe</h1>
        <p className="mt-2 max-w-xl text-sm text-ink/60 dark:text-paper/60">
          Satellites-style view, but grounded — every dot is a real institution from OpenAlex. Hover for name,
          click to open. Arcs show collaboration from the top hub.
        </p>
      </div>

      <InstitutionsGlobe />

      <div className="grid gap-3 md:grid-cols-2">
        {institutions.map((inst: any) => (
          <Link key={inst.id} href={`/institutions/${encodeURIComponent(shortId(inst.id))}`} className="card">
            <div className="font-display text-lg font-bold">{inst.display_name}</div>
            <div className="mt-1 text-xs text-ink/50 dark:text-paper/50">
              {inst.country_code ?? ""} {inst.type ? `· ${inst.type}` : ""} ·{" "}
              {inst.works_count?.toLocaleString()} works
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
