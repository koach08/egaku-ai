import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All AI Tools — EGAKU AI | EGAKU AI",
  description: "Browse all 20+ AI creative tools in one place.",
  openGraph: {
    title: "All AI Tools — EGAKU AI",
    description: "Browse all 20+ AI creative tools in one place.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
