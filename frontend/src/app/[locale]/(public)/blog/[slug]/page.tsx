import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { ARTICLES } from "./articles";
import { PremiumGate } from "@/components/premium-gate";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; locale: string }> };

export async function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) return { title: "Not Found" };

  const t = article.translations[locale] || article.translations.en;
  if (!t) return { title: "Not Found" };

  return {
    title: `${t.title} — EGAKU Journal`,
    description: t.description,
    alternates: {
      canonical: `/blog/${slug}`,
      languages: { en: `/blog/${slug}`, ja: `/ja/blog/${slug}` },
    },
    openGraph: {
      title: t.title,
      description: t.description,
      type: "article",
      publishedTime: article.publishedAt,
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug, locale } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) notFound();

  const t = article.translations[locale] || article.translations.en;
  if (!t) notFound();

  const categoryColors: Record<string, string> = {
    "how-to": "bg-blue-500/20 text-blue-400",
    news: "bg-green-500/20 text-green-400",
    guide: "bg-purple-500/20 text-purple-400",
    tips: "bg-amber-500/20 text-amber-400",
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">Home</Link>
          {" / "}
          <Link href="/blog" className="hover:text-foreground">Journal</Link>
          {" / "}
          <span className="text-foreground">{t.title}</span>
        </nav>

        {/* Article Header */}
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Badge className={categoryColors[article.category] || "bg-muted"}>
              {article.category}
            </Badge>
            <span className="text-xs text-muted-foreground">{article.readingTime} min read</span>
            <span className="text-xs text-muted-foreground">·</span>
            <time className="text-xs text-muted-foreground">{article.publishedAt}</time>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground mt-3">{t.description}</p>
          <div className="flex items-center gap-2 mt-4">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold">E</div>
            <span className="text-xs text-muted-foreground">by <span className="text-foreground font-medium">EGAKU AI Team</span></span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {article.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        </header>

        {/* Article Body */}
        <article className="prose prose-invert prose-sm max-w-none">
          <PremiumGate
            premium={article.premium || false}
            previewCount={article.previewSections || 2}
            sections={t.sections}
          />
        </article>

        {/* CTA */}
        <div className="mt-12 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Try it yourself</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create images and videos with 30+ AI models. Free to start.
          </p>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600" render={<Link href="/generate" />}>
            Start Generating Free
          </Button>
        </div>

        {/* Related Articles */}
        <div className="mt-12">
          <h3 className="text-sm font-semibold mb-4">More Articles</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {ARTICLES.filter((a) => a.slug !== slug).slice(0, 4).map((a) => {
              const at = a.translations[locale] || a.translations.en;
              return (
                <Link
                  key={a.slug}
                  href={`/blog/${a.slug}`}
                  className="rounded-lg border border-muted p-4 hover:border-purple-500/30 transition-colors"
                >
                  <Badge className={`${categoryColors[a.category] || "bg-muted"} text-[10px] mb-2`}>
                    {a.category}
                  </Badge>
                  <p className="text-sm font-medium">{at?.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{a.readingTime} min · {a.publishedAt}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
