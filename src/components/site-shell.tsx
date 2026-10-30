"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useContent } from "./content-provider";
import { buttonVariants } from "./ui/button";
import { safePhone } from "@/lib/utils";
import type { Locale, SiteData } from "@/lib/types";

const words = {
  en: { collections: "Collections", about: "Our story", contact: "Get in touch", menu: "Open menu", close: "Close menu", local: "Local prototype", privacy: "Privacy", editor: "Edit this browser", explore: "Explore", line: "A space for the moments that make a home." },
  bn: { collections: "কালেকশন", about: "আমাদের গল্প", contact: "যোগাযোগ", menu: "মেনু খুলুন", close: "মেনু বন্ধ করুন", local: "লোকাল প্রোটোটাইপ", privacy: "গোপনীয়তা", editor: "এই ব্রাউজারে সম্পাদনা", explore: "দেখুন", line: "যে মুহূর্তগুলো ঘরকে আপন করে তোলে।" },
};

function translatedPath(pathname: string, to: Locale, data: SiteData) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[1] === "products" && parts[2]) {
    const current = data.products.find((p) => p.lang === parts[0] && p.slug === parts[2]);
    const match = data.products.find((p) => p.lang === to && p.translationId === current?.translationId);
    return match ? `/${to}/products/${match.slug}` : `/${to}`;
  }
  if (parts[1] === "collections" && parts[2]) {
    const current = data.collections.find((c) => c.lang === parts[0] && c.slug === parts[2]);
    const match = data.collections.find((c) => c.lang === to && c.translationId === current?.translationId);
    return match ? `/${to}/collections/${match.slug}` : `/${to}`;
  }
  if (["collections", "about", "contact", "privacy"].includes(parts[1])) return `/${to}/${parts[1]}`;
  return `/${to}`;
}

export function SiteShell({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  const { data, warning } = useContent();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const text = words[lang];
  const isHome = pathname === `/${lang}`;

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const nav = [
    { href: `/${lang}/collections`, label: text.collections },
    { href: `/${lang}/about`, label: text.about },
    { href: `/${lang}/contact`, label: text.contact },
  ];

  return <>
    <a className="skip-link" href="#main">{lang === "bn" ? "মূল অংশে যান" : "Skip to content"}</a>
    <header className={`site-header ${isHome ? "site-header--hero" : "site-header--light"}`}>
      <div className="site-header__inner wrap">
        <Link href={`/${lang}`} className="wordmark" aria-label={lang === "bn" ? "আঙিনা হোম" : "AANGAN home"}>
          <span>{lang === "bn" ? data.brand.nameBn : data.brand.name}</span><small>KITCHENS</small>
        </Link>
        <nav className="desktop-nav" aria-label={lang === "bn" ? "প্রধান মেনু" : "Main navigation"}>
          {nav.map((item) => <Link key={item.href} href={item.href} className={pathname === item.href ? "active" : ""}>{item.label}</Link>)}
        </nav>
        <div className="header-actions">
          <Link className="lang-switch" href={translatedPath(pathname, lang === "en" ? "bn" : "en", data)} aria-label={lang === "en" ? "বাংলা ভাষায় দেখুন" : "View in English"}>{lang === "en" ? "বাংলা" : "EN"}</Link>
          <Link href={`/${lang}/contact`} className="header-cta">{text.contact}<ArrowUpRight size={16} aria-hidden="true" /></Link>
          <button className="menu-toggle" type="button" aria-label={open ? text.close : text.menu} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={25} /> : <Menu size={25} />}</button>
        </div>
      </div>
      {open && <nav className="mobile-nav" aria-label={lang === "bn" ? "মোবাইল মেনু" : "Mobile navigation"}>
        {nav.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}<ArrowUpRight size={17} /></Link>)}
        <Link href={translatedPath(pathname, lang === "en" ? "bn" : "en", data)} onClick={() => setOpen(false)}>{lang === "en" ? "বাংলায় দেখুন" : "View in English"}</Link>
      </nav>}
    </header>
    {warning && <div className="storage-warning" role="alert">{warning}</div>}
    <main id="main">{children}</main>
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div><Link href={`/${lang}`} className="wordmark wordmark--footer"><span>{lang === "bn" ? data.brand.nameBn : data.brand.name}</span><small>KITCHENS</small></Link><p>{text.line}</p></div>
        <div className="footer-links"><span>{text.explore}</span><Link href={`/${lang}/collections`}>{text.collections}</Link><Link href={`/${lang}/about`}>{text.about}</Link><Link href={`/${lang}/contact`}>{text.contact}</Link></div>
        <div className="footer-links"><span>{text.local}</span><Link href={`/${lang}/privacy`}>{text.privacy}</Link><Link href="/studio">{text.editor}</Link>{data.brand.phone && <a href={`tel:${safePhone(data.brand.phone)}`}>{data.brand.phone}</a>}</div>
      </div>
      <div className="wrap footer-bottom"><span>© {new Date().getFullYear()} {data.brand.name}. {text.local}.</span><span>{lang === "bn" ? "তথ্য শুধু এই ব্রাউজারে থাকে" : "Your edits stay in this browser"}</span></div>
    </footer>
  </>;
}
