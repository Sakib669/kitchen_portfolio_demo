import type { Metadata } from "next";

export const metadata: Metadata = { title: "Local editor | AANGAN", robots: { index: false, follow: false } };

export default function StudioLayout({ children }: { children: React.ReactNode }) { return children; }
