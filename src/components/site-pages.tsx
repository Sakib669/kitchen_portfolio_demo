"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { useContent } from "./content-provider";
import { SiteShell } from "./site-shell";
import { Button, buttonVariants } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { cn, safePhone } from "@/lib/utils";
import { inquirySchema } from "@/lib/schema";
import type { Collection, Locale, Product } from "@/lib/types";

const copy = {
  en: { discover: "Discover the collection", collections: "Our collections", view: "Explore collection", products: "Kitchen ideas", details: "View kitchen", all: "All collections", made: "Thoughtful spaces, everyday moments.", explore: "Explore the kitchens", start: "Let's begin with your space.", talk: "Leave a note", back: "Back to collections", inquiry: "Enquire about this kitchen", formName: "Your name", formEmail: "Email address", formPhone: "Phone number", formMessage: "Tell us about your space", consent: "I understand this note is saved only on this device and is not sent.", save: "Save on this device", saved: "Saved on this device, not sent.", savedDetail: "Your note is in this browser only. You can review or export it from the local editor.", required: "Add your name, a way to contact you, a message, and consent.", retry: "The note could not be saved. Check browser storage and try again.", local: "Local demo only", privacy: "Read how this works", viewAll: "View all collections", noPage: "This page is unavailable", home: "Return home", noProduct: "This kitchen is unavailable in this browser.", noCollection: "This collection is unavailable in this browser.", related: "More from this collection", image: "Kitchen interior", page: "Page" },
  bn: { discover: "কালেকশন দেখুন", collections: "আমাদের কালেকশন", view: "কালেকশন দেখুন", products: "রান্নাঘরের ভাবনা", details: "রান্নাঘর দেখুন", all: "সব কালেকশন", made: "ভাবনায় সাজানো ঘর, প্রতিদিনের মুহূর্ত।", explore: "রান্নাঘর দেখুন", start: "আপনার ঘর থেকে শুরু করি।", talk: "একটি নোট লিখুন", back: "কালেকশনে ফিরুন", inquiry: "এই রান্নাঘর নিয়ে লিখুন", formName: "আপনার নাম", formEmail: "ইমেইল", formPhone: "ফোন নম্বর", formMessage: "আপনার ঘরের কথা লিখুন", consent: "আমি বুঝেছি, এই নোট শুধু এই ডিভাইসে সেভ হবে, পাঠানো হবে না।", save: "এই ডিভাইসে সেভ করুন", saved: "এই ডিভাইসে সেভ হয়েছে, পাঠানো হয়নি।", savedDetail: "নোটটি শুধু এই ব্রাউজারে আছে। লোকাল এডিটর থেকে দেখতে বা এক্সপোর্ট করতে পারবেন।", required: "নাম, ইমেইল বা ফোন, বার্তা ও সম্মতি দিন।", retry: "নোটটি সেভ হয়নি। ব্রাউজার স্টোরেজ দেখে আবার চেষ্টা করুন।", local: "শুধু লোকাল ডেমো", privacy: "এটি কীভাবে কাজ করে", viewAll: "সব কালেকশন দেখুন", noPage: "এই পেজটি নেই", home: "হোমে ফিরুন", noProduct: "এই রান্নাঘরটি এই ব্রাউজারে নেই।", noCollection: "এই কালেকশনটি এই ব্রাউজারে নেই।", related: "এই কালেকশনের আরও ডিজাইন", image: "রান্নাঘরের ছবি", page: "পেজ" },
};

function Picture({ src, alt, className = "", priority = false }: { src: string; alt: string; className?: string; priority?: boolean }) {
  return <div className={cn("picture", className)}><Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 60vw" priority={priority} /></div>;
}

function CollectionCard({ item, lang, number }: { item: Collection; lang: Locale; number?: number }) {
  const t = copy[lang];
  return <Link className="collection-card" href={`/${lang}/collections/${item.slug}`}>
    <Picture src={item.image} alt={item.title} />
    <div className="collection-card__body"><span className="card-number">{String(number ?? item.order).padStart(2, "0")} / {t.collections}</span><div className="collection-card__title"><h3>{item.title}</h3><ArrowUpRight size={24} /></div><p>{item.intro}</p></div>
  </Link>;
}

function ProductCard({ item, lang }: { item: Product; lang: Locale }) {
  return <Link className="product-card" href={`/${lang}/products/${item.slug}`}><Picture src={item.image} alt={item.title} /><div className="product-card__body"><div><span className="eyebrow">{copy[lang].products} / {String(item.order).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.summary}</p></div><span className="round-arrow"><ArrowUpRight size={19} /></span></div></Link>;
}

function Home({ lang }: { lang: Locale }) {
  const { data } = useContent(); const t = copy[lang]; const page = data.pages.home[lang];
  const collections = page.featured.map((id) => data.collections.find((item) => item.id === id && item.lang === lang)).filter((item): item is Collection => Boolean(item));
  return <>
    <section className="home-hero"><Picture src={page.image} alt={t.image} className="home-hero__image" priority /><div className="home-hero__shade" /><div className="wrap home-hero__content"><span className="eyebrow eyebrow--light"><span className="eyebrow-line" />{page.kicker}</span><h1>{page.headline}</h1><p>{page.subhead}</p><Link href={`/${lang}/collections`} className="hero-link">{t.discover}<span><ArrowUpRight size={20} /></span></Link></div><a className="hero-scroll" href="#intro" aria-label={lang === "bn" ? "নিচে যান" : "Scroll to explore"}><ArrowDown size={20} /></a><div className="hero-index">01 — 03</div></section>
    <section id="intro" className="intro-section section-pad"><div className="wrap intro-grid"><span className="eyebrow"><span className="eyebrow-line" /> AANGAN / {data.brand.tagline}</span><div><h2>{t.made}</h2><p>{page.body}</p><Link className="text-link" href={`/${lang}/about`}>{lang === "bn" ? "আমাদের গল্প" : "Our story"}<ArrowUpRight size={18} /></Link></div></div></section>
    <section className="feature-section section-pad"><div className="wrap"><div className="section-heading"><div><span className="eyebrow">01 / {t.collections}</span><h2>{t.explore}</h2></div><Link className="text-link" href={`/${lang}/collections`}>{t.viewAll}<ArrowUpRight size={18} /></Link></div><div className="collection-grid">{collections.map((item, i) => <CollectionCard key={item.id} item={item} lang={lang} number={i + 1} />)}</div></div></section>
    <section className="statement-section"><Picture src="/images/walnut-olive.webp" alt={t.image} /><div className="statement-panel"><span className="eyebrow">AANGAN / {t.made}</span><h2>{t.start}</h2><p>{lang === "bn" ? "আপনার ঘরের গল্পটি শেয়ার করুন। এই প্রোটোটাইপে নোটটি আপনার ব্রাউজারেই থাকবে।" : "Share the beginnings of your kitchen story. In this prototype, your note stays in your browser."}</p><Link href={`/${lang}/contact`} className={cn(buttonVariants({ variant: "primary" }), "statement-button")}>{t.talk}<ArrowUpRight size={18} /></Link></div></section>
  </>;
}

function CollectionsPage({ lang }: { lang: Locale }) {
  const { data } = useContent(); const page = data.pages.collections[lang]; const items = data.collections.filter((item) => item.lang === lang).sort((a, b) => a.order - b.order);
  return <><PageHero title={page.title} kicker={page.kicker} image={page.image} intro={page.body} /><section className="listing-section section-pad"><div className="wrap"><div className="section-heading"><span className="eyebrow">{copy[lang].all}</span><span className="count-label">{String(items.length).padStart(2, "0")}</span></div><div className="collection-grid collection-grid--listing">{items.map((item, i) => <CollectionCard key={item.id} item={item} lang={lang} number={i + 1} />)}</div></div></section></>;
}

function PageHero({ title, kicker, image, intro }: { title: string; kicker: string; image: string; intro?: string }) {
  return <section className="page-hero"><Picture src={image} alt="" className="page-hero__image" priority /><div className="page-hero__shade" /><div className="wrap page-hero__content"><span className="eyebrow eyebrow--light"><span className="eyebrow-line" />{kicker}</span><h1>{title}</h1>{intro && <p>{intro}</p>}</div></section>;
}

function CollectionDetail({ lang, slug }: { lang: Locale; slug: string }) {
  const { data } = useContent(); const item = data.collections.find((entry) => entry.lang === lang && entry.slug === slug); const t = copy[lang];
  if (!item) return <Missing lang={lang} detail={t.noCollection} />;
  const products = data.products.filter((entry) => entry.collectionId === item.id && entry.lang === lang).sort((a, b) => a.order - b.order);
  return <><PageHero title={item.title} kicker={t.collections} image={item.image} intro={item.intro} /><section className="listing-section section-pad"><div className="wrap"><Link className="back-link" href={`/${lang}/collections`}><ArrowLeft size={17} />{t.back}</Link><div className="section-heading"><div><span className="eyebrow">{item.title}</span><h2>{t.products}</h2></div><span className="count-label">{String(products.length).padStart(2, "0")}</span></div><div className="product-grid">{products.map((product) => <ProductCard key={product.id} item={product} lang={lang} />)}</div></div></section></>;
}

function ProductDetail({ lang, slug }: { lang: Locale; slug: string }) {
  const { data } = useContent(); const item = data.products.find((entry) => entry.lang === lang && entry.slug === slug); const t = copy[lang]; const [active, setActive] = useState(0);
  if (!item) return <Missing lang={lang} detail={t.noProduct} />;
  const collection = data.collections.find((entry) => entry.id === item.collectionId); const gallery = item.gallery.length ? item.gallery : [item.image];
  const related = data.products.filter((entry) => entry.lang === lang && entry.collectionId === item.collectionId && entry.id !== item.id);
  return <><div className="product-detail wrap"><div className="crumbs"><Link href={`/${lang}/collections`}>{t.collections}</Link><span>/</span>{collection && <><Link href={`/${lang}/collections/${collection.slug}`}>{collection.title}</Link><span>/</span></>}{item.title}</div><div className="product-detail__grid"><div className="product-gallery"><Picture src={gallery[Math.min(active, gallery.length - 1)]} alt={`${item.title} — ${active + 1}`} priority /><div className="gallery-controls"><div className="gallery-dots">{gallery.map((image, i) => <button key={`${image}-${i}`} type="button" className={active === i ? "active" : ""} aria-label={`${t.image} ${i + 1}`} onClick={() => setActive(i)} />)}</div><span>{String(active + 1).padStart(2, "0")} / {String(gallery.length).padStart(2, "0")}</span></div></div><div className="product-detail__copy"><span className="eyebrow"><span className="eyebrow-line" />{collection?.title ?? t.products}</span><h1>{item.title}</h1><p className="product-lede">{item.summary}</p><div className="thin-rule" /><p className="body-copy">{item.story}</p><Link href={`/${lang}/contact?product=${encodeURIComponent(item.id)}`} className={cn(buttonVariants({ variant: "primary" }), "product-inquiry")}>{t.inquiry}<ArrowUpRight size={18} /></Link><span className="local-note">{t.local}</span></div></div></div>{related.length > 0 && <section className="related-section section-pad"><div className="wrap"><div className="section-heading"><div><span className="eyebrow">{collection?.title}</span><h2>{t.related}</h2></div></div><div className="product-grid">{related.map((product) => <ProductCard key={product.id} item={product} lang={lang} />)}</div></div></section>}</>;
}

function TextPage({ lang, kind }: { lang: Locale; kind: "about" | "privacy" }) {
  const { data } = useContent(); const page = data.pages[kind][lang];
  return <><PageHero title={page.title} kicker={page.kicker} image={page.image} /><section className="text-page section-pad"><div className="wrap text-page__grid"><span className="eyebrow">AANGAN / {page.kicker}</span><div className="body-copy">{page.body.split("\n\n").map((para, i) => <p key={i}>{para}</p>)}{kind === "about" && <Link className="text-link" href={`/${lang}/collections`}>{copy[lang].explore}<ArrowUpRight size={18} /></Link>}{kind === "privacy" && <Link className="text-link" href="/studio">{lang === "bn" ? "লোকাল এডিটর খুলুন" : "Open the local editor"}<ArrowUpRight size={18} /></Link>}</div></div></section></>;
}

function ContactPage({ lang, productId }: { lang: Locale; productId?: string }) {
  const { data, save } = useContent(); const page = data.pages.contact[lang]; const t = copy[lang];
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [message, setMessage] = useState(""); const [consent, setConsent] = useState(false); const [status, setStatus] = useState(""); const [done, setDone] = useState(false);
  const product = data.products.find((item) => item.id === productId && item.lang === lang);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("");
    const inquiry = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), lang, name, email, phone, message, consent, ...(product ? { productId: product.id } : {}) };
    const valid = inquirySchema.safeParse(inquiry);
    if (!valid.success) { setStatus(t.required); return; }
    const result = save({ ...data, inquiries: [...data.inquiries, valid.data] });
    if (!result.ok) { setStatus(t.retry); return; }
    setDone(true);
  }
  return <><PageHero title={page.title} kicker={page.kicker} image={page.image} /><section className="contact-section section-pad"><div className="wrap contact-grid"><div className="contact-intro"><span className="eyebrow"><span className="eyebrow-line" />{t.local}</span><h2>{t.start}</h2><p>{page.body}</p><Link href={`/${lang}/privacy`} className="text-link">{t.privacy}<ArrowUpRight size={17} /></Link>{data.brand.phone && <a className="text-link" href={`tel:${safePhone(data.brand.phone)}`}>{lang === "bn" ? "সরাসরি ফোন করুন" : "Call directly"}: {data.brand.phone}<ArrowUpRight size={17} /></a>}{data.brand.whatsapp && <a className="text-link" href={`https://wa.me/${safePhone(data.brand.whatsapp).replace(/^\+/, "")}`} target="_blank" rel="noreferrer">WhatsApp<ArrowUpRight size={17} /></a>}</div><div className="contact-form-wrap">{done ? <div className="success-message" role="status"><span className="success-icon"><Check size={28} /></span><h3>{t.saved}</h3><p>{t.savedDetail}</p><Link href="/studio" className="text-link">{lang === "bn" ? "লোকাল এডিটর" : "Local editor"}<ArrowUpRight size={17} /></Link></div> : <form onSubmit={submit} className="contact-form"><span className="eyebrow">{t.talk}</span>{product && <div className="context-pill">{t.inquiry}: <strong>{product.title}</strong></div>}<div className="form-row"><label>{t.formName}<Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} autoComplete="name" /></label><label>{t.formEmail}<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={250} autoComplete="email" /></label></div><label>{t.formPhone}<Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={50} autoComplete="tel" /></label><label>{t.formMessage}<Textarea value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={2000} rows={5} /></label><label className="checkbox-label"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required /><span>{t.consent}</span></label>{status && <p className="form-error" role="alert">{status}</p>}<Button type="submit" className="w-full justify-between">{t.save}<ArrowRight size={18} /></Button><small>{t.saved}</small></form>}</div></div></section></>;
}

function Missing({ lang, detail }: { lang: Locale; detail?: string }) { return <div className="missing-page wrap"><span className="eyebrow">404 / {copy[lang].page}</span><h1>{copy[lang].noPage}</h1><p>{detail}</p><Link className={buttonVariants({ variant: "primary" })} href={`/${lang}`}>{copy[lang].home}<ArrowUpRight size={18} /></Link></div>; }

export function SitePages({ lang, segments, productId }: { lang: Locale; segments: string[]; productId?: string }) {
  const [first, second] = segments;
  let page: React.ReactNode;
  if (!first) page = <Home lang={lang} />;
  else if (first === "collections" && !second) page = <CollectionsPage lang={lang} />;
  else if (first === "collections" && second && segments.length === 2) page = <CollectionDetail lang={lang} slug={second} />;
  else if (first === "products" && second && segments.length === 2) page = <ProductDetail lang={lang} slug={second} />;
  else if (first === "about" && segments.length === 1) page = <TextPage lang={lang} kind="about" />;
  else if (first === "privacy" && segments.length === 1) page = <TextPage lang={lang} kind="privacy" />;
  else if (first === "contact" && segments.length === 1) page = <ContactPage lang={lang} productId={productId} />;
  else page = <Missing lang={lang} />;
  return <SiteShell lang={lang}>{page}</SiteShell>;
}
