import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Content Policy & Guidelines",
  description:
    "EGAKU AI content policy covering content guidelines, prohibited content, regional compliance (US, EU, Japan, Korea), age verification, and content moderation.",
  alternates: {
    canonical: "/content-policy",
    languages: {
      en: "/content-policy",
      ja: "/ja/content-policy",
      es: "/es/content-policy",
      zh: "/zh/content-policy",
    },
  },
  openGraph: {
    title: "Content Policy & Guidelines | EGAKU AI",
    description:
      "EGAKU AI content policy covering content guidelines, prohibited content, and regional compliance.",
  },
};

export default function ContentPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
