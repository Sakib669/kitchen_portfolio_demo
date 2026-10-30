import { z } from "zod";

const locale = z.enum(["en", "bn"]);
const imagePath = z.string().refine((value) => /^\/images\/[a-z0-9-]+\.webp$/.test(value), "Choose a bundled image");
const text = (max = 2000) => z.string().trim().min(1).max(max);
const optionalUrl = z.string().refine((value) => value === "" || /^https:\/\//.test(value), "Use an https URL");

const page = z.object({
  title: text(160),
  kicker: text(120),
  body: text(6000),
  image: imagePath,
  seoTitle: text(160),
  seoDescription: text(300),
});

const home = page.extend({
  headline: text(180),
  subhead: text(320),
  featured: z.array(z.string().min(1)).max(6),
});

const collection = z.object({
  id: z.string().min(1),
  translationId: z.string().min(1),
  lang: locale,
  slug: z.string().regex(/^[a-z0-9-]+$/).min(1).max(80),
  title: text(120),
  intro: text(600),
  image: imagePath,
  order: z.number().int().min(0).max(999),
  seoTitle: text(160),
  seoDescription: text(300),
});

const product = collection.omit({ intro: true }).extend({
  summary: text(600),
  story: text(4000),
  gallery: z.array(imagePath).min(1).max(8),
  collectionId: z.string().min(1),
});

export const inquirySchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  lang: locale,
  name: text(120),
  email: z.string().trim().email().or(z.literal("")),
  phone: z.string().trim().max(50),
  message: text(2000),
  consent: z.literal(true),
  productId: z.string().optional(),
}).refine((value) => value.email !== "" || value.phone !== "", {
  message: "Add an email or phone number",
  path: ["email"],
});

export const siteDataSchema = z.object({
  version: z.literal(1),
  brand: z.object({
    name: text(80),
    nameBn: text(80),
    tagline: text(120),
    taglineBn: text(120),
    phone: z.string().max(50),
    whatsapp: z.string().max(50),
    instagram: optionalUrl,
    logo: z.string().max(200),
    socialImage: imagePath,
  }),
  pages: z.object({
    home: z.object({ en: home, bn: home }),
    about: z.object({ en: page, bn: page }),
    collections: z.object({ en: page, bn: page }),
    contact: z.object({ en: page, bn: page }),
    privacy: z.object({ en: page, bn: page }),
  }),
  collections: z.array(collection).max(100),
  products: z.array(product).max(400),
  inquiries: z.array(inquirySchema).max(500),
}).superRefine((data, ctx) => {
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const item of [...data.collections, ...data.products]) {
    if (ids.has(item.id)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate ID: ${item.id}` });
    ids.add(item.id);
    const kind = "collectionId" in item ? "product" : "collection";
    const slugKey = `${kind}:${item.lang}:${item.slug}`;
    if (slugs.has(slugKey)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate slug: ${item.slug}` });
    slugs.add(slugKey);
  }
  for (const item of data.products) {
    const owner = data.collections.find((entry) => entry.id === item.collectionId);
    if (!owner || owner.lang !== item.lang) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${item.title} needs a collection in ${item.lang}` });
  }
  for (const lang of ["en", "bn"] as const) {
    for (const id of data.pages.home[lang].featured) {
      if (!data.collections.some((entry) => entry.id === id && entry.lang === lang)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Featured collection ${id} is missing` });
      }
    }
  }
});
