// Helpers to present the shared AiCache table as an AI run history.
// Keys: reading-path:v1:{model}:{topic} | brief:v1:{model}:{sha16(url)}
// This is a stepping stone toward a dedicated AiRun table (model, prompt
// hash, tokens, latency, status) — the UI below already consumes that shape.

export type AiRunKind = "reading-path" | "brief" | "unknown";

export interface ParsedCacheKey {
  kind: AiRunKind;
  model: string | null;
  label: string;
}

export function parseCacheKey(key: string): ParsedCacheKey {
  const parts = key.split(":");
  if (parts[0] === "reading-path" && parts.length >= 4) {
    const model = parts.slice(2, -1).join(":") || null;
    return { kind: "reading-path", model, label: parts[parts.length - 1] };
  }
  if (parts[0] === "brief" && parts.length >= 4) {
    const model = parts.slice(2, -1).join(":") || null;
    return { kind: "brief", model, label: `url hash ${parts[parts.length - 1]}` };
  }
  return { kind: "unknown", model: null, label: key };
}

export function previewResponse(response: unknown, max = 160): string {
  if (typeof response === "string") return response.slice(0, max);
  if (Array.isArray(response)) {
    const titles = response
      .slice(0, 5)
      .map((s: any) => s?.title ?? s?.openalexId ?? "?")
      .join(" → ");
    return titles.slice(0, max);
  }
  if (response && typeof response === "object") {
    const b = (response as any).brief;
    if (typeof b === "string") return b.slice(0, max);
  }
  try {
    return JSON.stringify(response).slice(0, max);
  } catch {
    return "";
  }
}
