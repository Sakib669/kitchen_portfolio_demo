import type { MetadataRoute } from "next";
import { starterData } from "@/lib/starter";
import { siteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl;
  const routes = ["", "/collections", "/about", "/contact", "/privacy"];
  const pages = ["en", "bn"].flatMap((lang) => routes.map((route) => `${origin}/${lang}${route}`));
  const collections = starterData.collections.map((item) => `${origin}/${item.lang}/collections/${item.slug}`);
  const products = starterData.products.map((item) => `${origin}/${item.lang}/products/${item.slug}`);
  return [...pages, ...collections, ...products].map((url) => ({ url, changeFrequency: "monthly", priority: url.endsWith("/en") || url.endsWith("/bn") ? 1 : 0.7 }));
}
