export type Locale = "en" | "bn";

export type PageContent = {
  title: string;
  kicker: string;
  body: string;
  image: string;
  seoTitle: string;
  seoDescription: string;
};

export type HomeContent = PageContent & {
  headline: string;
  subhead: string;
  featured: string[];
};

export type Brand = {
  name: string;
  nameBn: string;
  tagline: string;
  taglineBn: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  logo: string;
  socialImage: string;
};

export type Collection = {
  id: string;
  translationId: string;
  lang: Locale;
  slug: string;
  title: string;
  intro: string;
  image: string;
  order: number;
  seoTitle: string;
  seoDescription: string;
};

export type Product = {
  id: string;
  translationId: string;
  lang: Locale;
  slug: string;
  title: string;
  summary: string;
  story: string;
  image: string;
  gallery: string[];
  collectionId: string;
  order: number;
  seoTitle: string;
  seoDescription: string;
};

export type Inquiry = {
  id: string;
  createdAt: string;
  lang: Locale;
  name: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
  productId?: string;
};

export type SiteData = {
  version: 1;
  brand: Brand;
  pages: {
    home: Record<Locale, HomeContent>;
    about: Record<Locale, PageContent>;
    collections: Record<Locale, PageContent>;
    contact: Record<Locale, PageContent>;
    privacy: Record<Locale, PageContent>;
  };
  collections: Collection[];
  products: Product[];
  inquiries: Inquiry[];
};

export const locales: Locale[] = ["en", "bn"];
export const isLocale = (value: string): value is Locale => locales.includes(value as Locale);
