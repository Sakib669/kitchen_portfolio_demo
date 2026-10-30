const host = (process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "localhost:3000").replace(/^https?:\/\//, "");
export const siteUrl = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
