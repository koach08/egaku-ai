import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "EGAKU AI privacy policy. How we collect, use, and protect your personal data in compliance with GDPR and international privacy laws.",
  alternates: {
    canonical: "/privacy",
    languages: {
      en: "/privacy",
      ja: "/ja/privacy",
      es: "/es/privacy",
      zh: "/zh/privacy",
    },
  },
  openGraph: {
    title: "Privacy Policy | EGAKU AI",
    description: "How EGAKU AI collects, uses, and protects your personal data.",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
