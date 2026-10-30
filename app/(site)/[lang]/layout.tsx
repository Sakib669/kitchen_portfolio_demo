import type { Metadata } from "next";
import "../../globals.css";
import { ContentProvider } from "@/components/content-provider";
import { siteUrl } from "@/lib/site-url";
import { isLocale } from "@/lib/types";
import { notFound } from "next/navigation";

export const metadata: Metadata = { metadataBase: new URL(siteUrl), applicationName: "AANGAN Kitchens" };

export default async function LanguageLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <html lang={lang}><body><ContentProvider>{children}</ContentProvider></body></html>;
}
