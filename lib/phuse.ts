// PHUSE repository client — mirrors phuse.global/Communications/PHUSE_Archive.
// Records come from their public Strapi API; files resolve to the same S3
// URL pattern their frontend builds (verified against live files).
const API = "https://cms.phuse.global/api/archives";
const S3 = "https://phuse.s3.eu-central-1.amazonaws.com/Archive";

export const PHUSE_EVENTS = ["Connect", "CSS", "SDE", "Webinar", "Data Transparency", "Working Group Events"];

export const PHUSE_REGIONS = ["APAC", "EU", "US", "Worldwide"];

export const PHUSE_CATEGORIES = [
  "Programming Languages",
  "Regulatory Environment",
  "Clinical Documents",
  "Industry Standards",
  "Drug Development",
  "Technology & Applications",
  "Therapeutic Areas",
  "Job Skills",
  "Data Engineering",
  "Data Science",
];

export type PhuseRecord = {
  id: string;
  event: string;
  year: string;
  city: string;
  region: string;
  title: string;
  author: string;
  company: string;
  coAuthor: string;
  category: string;
  keywords: string;
  files: string[];
};

export type PhuseFilters = {
  event?: string;
  year?: string;
  region?: string;
  city?: string;
  category?: string;
  title?: string;
  company?: string;
  author?: string;
  coAuthor?: string;
  keywords?: string;
};

function mapRecord(d: any): PhuseRecord {
  const a = d.attributes ?? {};
  return {
    id: String(d.id),
    event: a.event ?? "",
    year: String(a.year ?? ""),
    city: a.city ?? "",
    region: a.region ?? "",
    title: a.title ?? "",
    author: a.author ?? "",
    company: a.company ?? "",
    coAuthor: a.co_author ?? "",
    category: a.educational_category ?? "",
    keywords: a.keywords ?? "",
    files: String(a.filename ?? "")
      .split("\n")
      .map((s: string) => s.trim())
      .filter(Boolean),
  };
}

export function phuseFileUrl(r: Pick<PhuseRecord, "year" | "event" | "region" | "city">, filename: string) {
  if (/^https?:\/\//i.test(filename)) return filename;
  const seg = (s: string) => s.trim();
  return `${S3}/${seg(r.year)}/${seg(r.event)}/${seg(r.region)}/${seg(r.city)}/${filename.replace(/ /g, "+")}`;
}

/** The PAP_ file is the paper; PRE_ is the slide deck. */
export function paperFile(files: string[]) {
  return files.find((f) => /(^|\W)PAP_/i.test(f)) ?? files[0] ?? null;
}

export async function fetchArchive(
  f: PhuseFilters,
  page = 1,
  pageSize = 10,
): Promise<{ records: PhuseRecord[]; total: number; pageCount: number }> {
  const p = new URLSearchParams();
  p.set("pagination[page]", String(page));
  p.set("pagination[pageSize]", String(pageSize));
  p.set("sort", "year:desc");
  const eq = (k: string, v?: string) => {
    if (v) p.set(`filters[${k}][$eq]`, v);
  };
  const contains = (k: string, v?: string) => {
    if (v) p.set(`filters[${k}][$containsi]`, v);
  };
  eq("event", f.event);
  eq("year", f.year);
  eq("region", f.region);
  contains("city", f.city);
  eq("educational_category", f.category);
  contains("title", f.title);
  contains("company", f.company);
  contains("author", f.author);
  contains("co_author", f.coAuthor);
  contains("keywords", f.keywords);
  const res = await fetch(`${API}?${p.toString()}`, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`PHUSE archive ${res.status}`);
  const j = await res.json();
  return {
    records: (j.data ?? []).map(mapRecord),
    total: j.meta?.pagination?.total ?? 0,
    pageCount: j.meta?.pagination?.pageCount ?? 0,
  };
}

export async function fetchArchiveRecord(id: string): Promise<PhuseRecord | null> {
  try {
    const res = await fetch(`${API}/${encodeURIComponent(id)}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const j = await res.json();
    return j.data ? mapRecord(j.data) : null;
  } catch {
    return null;
  }
}
