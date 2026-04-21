import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Logo Maker — Generate Brand Logos | EGAKU AI",
  description: "Design professional logos with AI in seconds. 3 unique variations from your brand name.",
  openGraph: {
    title: "AI Logo Maker — Generate Brand Logos",
    description: "Design professional logos with AI in seconds. 3 unique variations from your brand name.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
