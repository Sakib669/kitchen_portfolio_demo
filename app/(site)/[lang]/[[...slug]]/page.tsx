import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SitePages } from "@/components/site-pages";
import { starterData } from "@/lib/starter";
import { isLocale, type Locale } from "@/lib/types";
import { siteUrl } from "@/lib/site-url";

type Params = { lang: string; slug?: string[] };

function starterMeta(lang: Locale, slug: string[]) {
  const [first, second] = slug;
  if (!first) return starterData.pages.home[lang];
  if (["about", "collections", "contact", "privacy"].includes(first) && !second) return starterData.pages[first as "about" | "collections" | "contact" | "privacy"][lang];
  if (first === "collections" && second) return starterData.collections.find((item) => item.lang === lang && item.slug === second);
  if (first === "products" && second) return starterData.products.find((item) => item.lang === lang && item.slug === second);
  return undefined;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang, slug = [] } = await params;
  if (!isLocale(lang)) return {};
  const content = starterMeta(lang, slug);
  if (!content) return { robots: { index: false, follow: false } };
  const [first, second] = slug;
  let otherPath = `/${lang === "en" ? "bn" : "en"}${slug.length ? `/${slug.join("/")}` : ""}`;
  if (first === "collections" && second) {
    const item = starterData.collections.find((entry) => entry.lang === lang && entry.slug === second);
    const pair = starterData.collections.find((entry) => entry.lang !== lang && entry.translationId === item?.translationId);
    otherPath = pair ? `/${pair.lang}/collections/${pair.slug}` : "";
  }
  if (first === "products" && second) {
    const item = starterData.products.find((entry) => entry.lang === lang && entry.slug === second);
    const pair = starterData.products.find((entry) => entry.lang !== lang && entry.translationId === item?.translationId);
    otherPath = pair ? `/${pair.lang}/products/${pair.slug}` : "";
  }
  const ownPath = `/${lang}${slug.length ? `/${slug.join("/")}` : ""}`;
  return { title: content.seoTitle, description: content.seoDescription, alternates: { canonical: `${siteUrl}${ownPath}`, languages: otherPath ? { [lang]: `${siteUrl}${ownPath}`, [lang === "en" ? "bn" : "en"]: `${siteUrl}${otherPath}` } : undefined }, openGraph: { title: content.seoTitle, description: content.seoDescription, images: ["image" in content ? content.image : starterData.brand.socialImage] } };
}

export default async function LocalizedPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<{ product?: string }> }) {
  const { lang, slug = [] } = await params;
  if (!isLocale(lang)) notFound();
  const query = await searchParams;
  return <SitePages lang={lang} segments={slug} productId={query.product} />;
}
