import { Link } from "@/i18n/navigation";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { ARTICLES } from "./[slug]/articles";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "EGAKU Journal — AI Creative Insights",
  description: "Tutorials, guides, and news about AI image and video generation. Learn prompts, settings, and the latest AI models.",
};

type Props = { params: Promise<{ locale: string }> };

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;

  const categoryColors: Record<string, string> = {
    "how-to": "bg-blue-500/20 text-blue-400",
    news: "bg-green-500/20 text-green-400",
    guide: "bg-purple-500/20 text-purple-400",
    tips: "bg-amber-500/20 text-amber-400",
  };

  const sorted = [...ARTICLES].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-10">
          <p className="text-xs font-medium tracking-widest text-purple-400 uppercase mb-2">EGAKU Journal</p>
          <h1 className="text-3xl font-bold">AI Creative Insights</h1>
          <p className="text-muted-foreground mt-2">
            Tutorials, guides, and news from the EGAKU AI team.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((article) => {
            const t = article.translations[locale] || article.translations.en;
            if (!t) return null;
            return (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="group rounded-xl border border-muted p-5 hover:border-purple-500/30 transition-all hover:shadow-lg"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={categoryColors[article.category] || "bg-muted"}>
                    {article.category}
                  </Badge>
                  {article.premium && (
                    <Badge className="bg-amber-500/20 text-amber-400 text-[9px]">Premium</Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground">{article.readingTime} min</span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <time className="text-[10px] text-muted-foreground">{article.publishedAt}</time>
                </div>
                <h2 className="text-base font-semibold group-hover:text-purple-400 transition-colors">
                  {t.title}
                </h2>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {t.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {article.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
