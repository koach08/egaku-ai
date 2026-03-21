import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "EGAKU AI terms of service. Rules for using our AI image and video generation platform, subscription plans, and content ownership.",
  alternates: {
    canonical: "/terms",
    languages: {
      en: "/terms",
      ja: "/ja/terms",
      es: "/es/terms",
      zh: "/zh/terms",
    },
  },
  openGraph: {
    title: "Terms of Service | EGAKU AI",
    description: "Terms of service for using EGAKU AI platform.",
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
