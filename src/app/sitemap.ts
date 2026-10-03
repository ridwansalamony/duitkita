import type { MetadataRoute } from "next";
import { publicPages, siteUrl } from "@/lib/seo";
export default function sitemap(): MetadataRoute.Sitemap {
  return Object.keys(publicPages).map((path) => ({
    url: siteUrl() + path,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
