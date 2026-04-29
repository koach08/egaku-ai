"use client";

import { useAuth } from "@/lib/auth-context";
import { Link } from "@/i18n/navigation";
import type { ArticleSection } from "@/app/[locale]/(public)/blog/[slug]/articles";

const sectionClasses =
  "text-sm text-muted-foreground leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-purple-400 [&_code]:text-xs [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-muted [&_th]:p-2 [&_th]:bg-muted/50 [&_th]:text-left [&_th]:text-xs [&_td]:border [&_td]:border-muted [&_td]:p-2 [&_td]:text-xs [&_a]:text-purple-400 [&_a]:hover:underline [&_strong]:text-foreground [&_p]:mb-3";

interface Props {
  premium: boolean;
  previewCount: number;
  sections: ArticleSection[];
}

export function PremiumGate({ premium, previewCount, sections }: Props) {
  const { user } = useAuth();

  // Logged-in users get full access. Free users see preview only for premium articles.
  const hasAccess = !premium || !!user;

  const visibleSections = hasAccess ? sections : sections.slice(0, previewCount);
  const hiddenCount = sections.length - visibleSections.length;

  return (
    <>
      {visibleSections.map((section, i) => (
        <section key={i} className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">{section.heading}</h2>
          <div
            className={sectionClasses}
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        </section>
      ))}

      {!hasAccess && hiddenCount > 0 && (
        <div className="relative mt-4">
          {/* Fade overlay */}
          <div className="absolute -top-20 left-0 right-0 h-20 bg-gradient-to-b from-transparent to-background z-10" />

          {/* Upgrade prompt */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center space-y-4">
            <p className="text-lg font-semibold">Premium Article</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              This article has {hiddenCount} more {hiddenCount === 1 ? "section" : "sections"}.
              Upgrade to Lite or above to read the full article and access all premium guides.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/#pricing"
                className="bg-white text-black hover:bg-white/90 font-semibold px-6 py-2.5 rounded-md text-sm inline-block"
              >
                Upgrade from ¥480/mo
              </Link>
              <Link
                href="/login"
                className="border border-white/20 hover:border-white/40 px-4 py-2.5 rounded-md text-sm text-muted-foreground inline-block"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
