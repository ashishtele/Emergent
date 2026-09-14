import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchArchive, fetchArchiveRecord, paperFile, phuseFileUrl, type PhuseRecord } from "../lib/phuse";

afterEach(() => vi.unstubAllGlobals());

const rec = (over: Partial<PhuseRecord> = {}): PhuseRecord => ({
  id: "1",
  event: "Connect",
  year: "2024",
  city: "Austin",
  region: "US",
  title: "T",
  author: "A",
  company: "C",
  coAuthor: "",
  category: "",
  keywords: "",
  files: [],
  ...over,
});

describe("phuseFileUrl", () => {
  it("builds the S3 archive URL from record segments", () => {
    expect(phuseFileUrl(rec(), "PAP_AR01.pdf")).toBe(
      "https://phuse.s3.eu-central-1.amazonaws.com/Archive/2024/Connect/US/Austin/PAP_AR01.pdf",
    );
  });
  it("passes through absolute URLs and encodes spaces like the PHUSE site", () => {
    expect(phuseFileUrl(rec(), "https://example.com/a.pdf")).toBe("https://example.com/a.pdf");
    expect(phuseFileUrl(rec({ city: " New York " }), "MY PAPER.pdf")).toBe(
      "https://phuse.s3.eu-central-1.amazonaws.com/Archive/2024/Connect/US/New York/MY+PAPER.pdf",
    );
  });
});

describe("paperFile", () => {
  it("prefers the PAP_ paper over PRE_ slides", () => {
    expect(paperFile(["PRE_ML07.pdf", "PAP_ML07.pdf"])).toBe("PAP_ML07.pdf");
  });
  it("falls back to first file or null", () => {
    expect(paperFile(["PRE_ML07.pdf"])).toBe("PRE_ML07.pdf");
    expect(paperFile([])).toBeNull();
  });
});

const strapiPage = {
  data: [
    {
      id: 7,
      attributes: {
        event: "Connect",
        city: "Austin",
        region: "US",
        title: "ML07",
        author: "Jane",
        company: "Acme",
        co_author: "John",
        educational_category: "Data Science",
        keywords: "ML07; AI",
        filename: "PAP_ML07.pdf\nPRE_ML07.pdf",
        year: "2024",
      },
    },
  ],
  meta: { pagination: { page: 1, pageSize: 10, pageCount: 3, total: 25 } },
};

describe("fetchArchive", () => {
  it("maps records and pagination, encoding site filters", async () => {
    const json = vi.fn(async () => strapiPage);
    const fakeFetch = vi.fn(async () => ({ ok: true, json }));
    vi.stubGlobal("fetch", fakeFetch);
    const out = await fetchArchive(
      { event: "Connect", year: "2024", region: "US", title: "ML", author: "Jane" },
      2,
      10,
    );
    expect(out.total).toBe(25);
    expect(out.pageCount).toBe(3);
    expect(out.records[0]).toMatchObject({
      id: "7",
      title: "ML07",
      files: ["PAP_ML07.pdf", "PRE_ML07.pdf"],
    });
    const url = String(vi.mocked(fetch).mock.calls[0][0]);
    expect(url).toContain("cms.phuse.global/api/archives?");
    expect(url).toContain("filters%5Bevent%5D%5B%24eq%5D=Connect");
    expect(url).toContain("filters%5Btitle%5D%5B%24containsi%5D=ML");
    expect(url).toContain("pagination%5Bpage%5D=2");
    expect(url).toContain("sort=year%3Adesc");
  });
  it("throws on API failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500 })),
    );
    await expect(fetchArchive({})).rejects.toThrow("PHUSE archive 500");
  });
  it("omits empty filters and tolerates missing payloads", async () => {
    const json = vi.fn(async () => ({}));
    const fakeFetch = vi.fn(async () => ({ ok: true, json }));
    vi.stubGlobal("fetch", fakeFetch);
    const out = await fetchArchive({});
    expect(out).toEqual({ records: [], total: 0, pageCount: 0 });
    const url = String(vi.mocked(fetch).mock.calls[0][0]);
    expect(url).not.toContain("filters");
    expect(url).toContain("sort=year%3Adesc");
  });
});

describe("fetchArchiveRecord", () => {
  it("returns a mapped record", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ data: strapiPage.data[0] }) })),
    );
    const out = await fetchArchiveRecord("7");
    expect(out?.title).toBe("ML07");
  });
  it("returns null on missing record or network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 404 })),
    );
    expect(await fetchArchiveRecord("7")).toBeNull();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({}) })),
    );
    expect(await fetchArchiveRecord("7")).toBeNull();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("down");
      }),
    );
    expect(await fetchArchiveRecord("7")).toBeNull();
  });
});
