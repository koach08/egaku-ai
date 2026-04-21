import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prompt Battle — AI Art Duel | EGAKU AI",
  description: "Challenge friends to AI art battles. Same theme, different prompts — community votes for the winner.",
  openGraph: {
    title: "Prompt Battle — AI Art Duel",
    description: "Challenge friends to AI art battles. Same theme, different prompts — community votes for the winner.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
