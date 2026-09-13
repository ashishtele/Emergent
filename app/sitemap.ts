import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const STATIC_ROUTES = ["/", "/search", "/topics", "/institutions", "/library", "/login", "/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
