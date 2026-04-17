import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Adult Expression - EGAKU AI",
  robots: { index: false, follow: false },
};

export default function AdultLayout({ children }: { children: React.ReactNode }) {
  return children;
}
