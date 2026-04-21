import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Referral Program — Earn Free Credits | EGAKU AI",
  description: "Invite friends to EGAKU AI. Both of you get bonus credits.",
  openGraph: {
    title: "Referral Program — Earn Free Credits",
    description: "Invite friends to EGAKU AI. Both of you get bonus credits.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
