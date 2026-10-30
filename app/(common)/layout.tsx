import type { Metadata } from "next";
import "../globals.css";
import { ContentProvider } from "@/components/content-provider";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "AANGAN Kitchens",
  description: "Thoughtful kitchen concepts for living in Bangladesh.",
  applicationName: "AANGAN Kitchens",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><ContentProvider>{children}</ContentProvider></body></html>;
}
