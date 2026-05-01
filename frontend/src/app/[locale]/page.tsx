import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { WebsiteJsonLd } from "@/components/json-ld";
import { ShowcaseGallery } from "@/components/showcase-gallery";
import { AnonGenerator } from "@/components/anon-generator";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { HeroVideo } from "@/components/hero-video";
import { FadeIn } from "@/components/fade-in";
import { LiveStats } from "@/components/live-stats";
import {
  ImageIcon, SwordsIcon, CameraIcon, PenToolIcon, SmileIcon,
  FilmIcon, MonitorIcon, LayoutIcon, ShoppingBagIcon, BookOpenIcon,
  CompassIcon, VideoIcon, WandIcon, EraserIcon, MaximizeIcon,
  SparklesIcon, ZapIcon, ClapperboardIcon, Music2Icon,
} from "lucide-react";

const planKeys = ["free", "lite", "basic", "pro", "unlimited", "studio"] as const;
const planPrices: Record<string, string> = {
  free: "0",
  lite: "480",
  basic: "980",
  pro: "2,980",
  unlimited: "4,980",
  studio: "6,980",
};

export default function LandingPage() {
  const t = useTranslations();

  return (
    <>
      <WebsiteJsonLd />
      <Header />
      <main>
        <AnnouncementBanner location="home" />

        {/* ── Hero ── */}
        <section className="relative overflow-hidden min-h-[90vh] flex items-center">
          <HeroVideo />

          <div className="relative z-10 container mx-auto px-4 pt-20 pb-24 text-center">
            <p className="text-sm font-medium tracking-widest uppercase text-white/50 mb-6">
              Veo 3 · Grok · Flux · Kling 3.0 · Seedance 2.0 + 30 Models
            </p>
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-[1.1]">
              {t("hero.title")}
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-lg text-white/60 leading-relaxed">
              {t("hero.subtitle")}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="text-base px-10 py-6 bg-white text-black hover:bg-white/90 font-semibold rounded-full" render={<Link href="/register" />}>
                Start Creating Free
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 hover:border-white/40 rounded-full" render={<a href="#pricing" />}>
                {t("hero.viewPricing")}
              </Button>
            </div>
            <p className="mt-4 text-xs text-white/40">
              50 free credits. No credit card required.
            </p>
          </div>
        </section>

        {/* ── Try It ── */}
        <FadeIn>
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-2xl font-bold text-center mb-2">Try it now</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">Type a prompt and generate an image instantly.</p>
          <div className="max-w-2xl mx-auto">
            <AnonGenerator />
          </div>
        </section>
        </FadeIn>

        {/* ── Showcase Gallery ── */}
        <FadeIn>
          <ShowcaseGallery title="Featured Images" filter="image" maxItems={24} />
        </FadeIn>
        <FadeIn delay={100}>
          <ShowcaseGallery title="Featured Videos" filter="video" maxItems={18} />
        </FadeIn>

        {/* ── Stats ── */}
        <FadeIn>
        <section className="container mx-auto px-4 py-16">
          <LiveStats />
        </section>
        </FadeIn>

        {/* ── AI Models ── */}
        <FadeIn>
        <section className="container mx-auto px-4 py-24">
          <h2 className="text-3xl font-bold text-center mb-3">30+ AI Models, One Platform</h2>
          <p className="text-base text-muted-foreground text-center mb-14 max-w-md mx-auto">
            The best models at a fraction of the cost.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
            {[
              { name: "Veo 3", tag: "Google Video + Audio", badge: "HOT", sample: "/samples/veo3.mp4", type: "video" },
              { name: "Grok Imagine", tag: "xAI Image + Video", badge: "NEW", sample: "/samples/grok.jpg", type: "image" },
              { name: "Kling 3.0", tag: "4K Cinematic Video", badge: "NEW", sample: "/samples/kling3_castle.mp4", type: "video" },
              { name: "GPT Image 2", tag: "OpenAI Latest", badge: "", sample: "/samples/gpt_image2.png", type: "image" },
              { name: "Flux Pro", tag: "Best Image Quality", badge: "", sample: "/samples/flux_dev.jpg", type: "image" },
              { name: "Ideogram v3", tag: "Text + Logo", badge: "", sample: "/samples/ideogram.png", type: "image" },
              { name: "Seedance 2.0", tag: "ByteDance Cinema + Audio", badge: "", sample: "/samples/kling3_cyberpunk.mp4", type: "video" },
              { name: "CivitAI", tag: "100K+ Community Models", badge: "", sample: "", type: "grid", gridImages: ["/samples/civitai_realistic.jpg","/samples/civitai_anime.jpg","/samples/civitai_fantasy.jpg","/samples/civitai_scifi.jpg"] },
              { name: "Nano Banana 2", tag: "Google 4K Ultra", badge: "", sample: "/samples/nano_banana.png", type: "image" },
              { name: "Wan 2.6", tag: "Free Video", badge: "Free", sample: "/samples/wan26.mp4", type: "video" },
              { name: "Luma Photon", tag: "Cinematic Lighting", badge: "", sample: "/samples/flux_dev.jpg", type: "image" },
              { name: "SDXL", tag: "Free 1024px", badge: "Free", sample: "/samples/sdxl.jpg", type: "image" },
            ].map((m) => (
              <Link key={m.name} href="/generate" className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-white/20 transition-all duration-300">
                {m.badge && (
                  <span className={`absolute top-2 right-2 z-10 text-[9px] font-semibold px-2 py-0.5 rounded-full ${m.badge === "HOT" ? "bg-white text-black" : m.badge === "Free" ? "bg-emerald-500/80 text-white" : "bg-white/10 text-white backdrop-blur-sm"}`}>
                    {m.badge}
                  </span>
                )}
                <div className="aspect-[4/3] bg-muted/20 overflow-hidden">
                  {m.type === "video" ? (
                    <video src={m.sample} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" autoPlay loop muted playsInline />
                  ) : m.type === "grid" ? (
                    <div className="w-full h-full grid grid-cols-2 gap-px bg-white/5">
                      {((m as Record<string, unknown>).gridImages as string[] || []).map((src, gi) => (
                        <img key={gi} src={src} alt={`${m.name} sample ${gi+1}`} className="w-full h-full object-cover" loading="lazy" />
                      ))}
                    </div>
                  ) : (
                    <img src={m.sample} alt={`${m.name} sample`} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" loading="lazy" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">{m.name}</p>
                  <p className="text-[11px] text-white/40">{m.tag}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
        </FadeIn>

        {/* ── Creative Tools ── */}
        <FadeIn>
        <section className="container mx-auto px-4 py-24">
          <h2 className="text-3xl font-bold text-center mb-3">Creative Tools</h2>
          <p className="text-center text-muted-foreground mb-14">Everything you need. One platform.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {([
              { name: "AI Movie Maker", desc: "One concept to finished movie. Scenes, video, music, export. 100% AI", href: "/movie-maker", Icon: ClapperboardIcon },
              { name: "AI Image Generator", desc: "30+ models including Flux Pro, Grok, GPT Image 2, Ideogram", href: "/generate", Icon: ImageIcon },
              { name: "AI Video Generator", desc: "Veo 3, Kling 3.0, Seedance 2.0, Wan 2.6 and more", href: "/generate", Icon: VideoIcon },
              { name: "AI Music Generator", desc: "Describe a mood and AI creates original music. Like Suno, built in", href: "/music-gen", Icon: Music2Icon },
              { name: "Prompt Battle", desc: "Challenge others to AI art duels and vote for the winner", href: "/battle", Icon: SwordsIcon },
              { name: "Photo Booth", desc: "Selfie to professional portrait for LinkedIn, dating, social", href: "/photo-booth", Icon: CameraIcon },
              { name: "Logo Maker", desc: "Brand name to professional logo variations instantly", href: "/logo", Icon: PenToolIcon },
              { name: "Meme Generator", desc: "AI creates the image, you add the punchline", href: "/meme", Icon: SmileIcon },
              { name: "Video Shorts", desc: "TikTok, Reels, Shorts vertical video in seconds", href: "/shorts", Icon: FilmIcon },
              { name: "Wallpaper Studio", desc: "Perfect wallpapers for iPhone, Android, Desktop, 4K", href: "/wallpaper", Icon: MonitorIcon },
              { name: "Storyboard Studio", desc: "Multi-scene video with BGM and narration", href: "/storyboard", Icon: LayoutIcon },
              { name: "Product Studio", desc: "Product photos to professional ad images for e-commerce", href: "/product-studio", Icon: ShoppingBagIcon },
              { name: "Short Story", desc: "Story idea to AI-generated visual scenes for social media", href: "/short-story", Icon: BookOpenIcon },
              { name: "AI Templates", desc: "One tap to create. No prompt needed", href: "/templates", Icon: ZapIcon },
              { name: "VFX Effects", desc: "Fire, water, lightning, and 12 more effects on any photo", href: "/vfx", Icon: SparklesIcon },
              { name: "Sketch to Image", desc: "Draw a rough sketch and AI turns it into a polished image", href: "/sketch", Icon: WandIcon },
              { name: "Object Removal", desc: "Paint over unwanted objects and erase them cleanly", href: "/remove-object", Icon: EraserIcon },
              { name: "Expand Image", desc: "Extend image borders with AI-generated content", href: "/expand", Icon: MaximizeIcon },
              { name: "Explore Gallery", desc: "Browse community creations and remix any prompt", href: "/gallery", Icon: CompassIcon },
            ] as const).map((tool) => (
              <Link
                key={tool.name}
                href={tool.href}
                className="group flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/15 hover:bg-white/[0.04] transition-all duration-300"
              >
                <tool.Icon className="size-5 text-white/30 group-hover:text-white/70 transition-colors mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm text-white/90 group-hover:text-white transition-colors">{tool.name}</h3>
                  <p className="text-xs text-white/40 mt-1 leading-relaxed">{tool.desc}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/tools" className="text-sm text-white/40 hover:text-white/70 transition-colors">
              View all tools →
            </Link>
          </div>
        </section>
        </FadeIn>

        {/* ── Pricing ── */}
        <FadeIn>
        <section id="pricing" className="container mx-auto px-4 py-24">
          <h2 className="text-3xl font-bold text-center mb-4">
            {t("pricing.title")}
          </h2>
          <div className="text-center mb-3">
            <span className="inline-block text-xs font-semibold bg-white/10 text-white/80 px-4 py-1.5 rounded-full">
              LAUNCH50 — 50% OFF first 3 months (limited)
            </span>
          </div>
          <p className="text-center text-sm text-muted-foreground mb-14">
            Regional pricing available. Up to 80% off based on your location.
          </p>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 max-w-7xl mx-auto">
            {planKeys.map((planKey) => {
              const price = planPrices[planKey];
              const features = t.raw(`plans.${planKey}.features`) as string[];
              const isRecommended = planKey === "basic";
              return (
                <Card
                  key={planKey}
                  className={isRecommended ? "border-white/30 ring-1 ring-white/10" : "border-white/[0.06]"}
                >
                  <CardHeader className="text-center">
                    {isRecommended && (
                      <span className="inline-block text-[10px] font-semibold bg-white text-black px-3 py-1 rounded-full mb-2">
                        RECOMMENDED
                      </span>
                    )}
                    <CardTitle className="text-base">{t(`plans.${planKey}.name`)}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">
                        {price === "0"
                          ? t("common.free")
                          : `¥${price}`}
                      </span>
                      {price !== "0" && (
                        <span className="text-muted-foreground text-sm">
                          {" "}{t("common.perMonth")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t(`plans.${planKey}.credits`)} {t("common.credits")}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-xs">
                      {features.map((f: string) => (
                        <li key={f} className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">&#10003;</span>
                          <span className="text-white/60">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full mt-6 rounded-full ${isRecommended ? "bg-white text-black hover:bg-white/90" : ""}`}
                      variant={isRecommended ? "default" : "outline"}
                      render={<Link href={price === "0" ? "/register" : `/register?plan=${planKey}`} />}
                    >
                      {price === "0"
                        ? t("common.startFree")
                        : t("common.subscribe")}
                    </Button>
                    {price !== "0" && (
                      <Link
                        href={`/register?plan=${planKey}&crypto=1`}
                        className="block w-full text-center text-[10px] text-white/30 hover:text-white/60 mt-2 py-1 transition-colors"
                      >
                        Pay with Crypto
                      </Link>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Self-hosted */}
          <Card className="mt-10 max-w-sm mx-auto border-dashed border-white/[0.06]">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-base">{t("pricing.selfHosted.title")}</CardTitle>
              <div className="mt-1">
                <span className="text-2xl font-bold">¥4,980</span>
                <span className="text-muted-foreground text-sm"> {t("common.oneTime")}</span>
              </div>
            </CardHeader>
            <CardContent className="text-center text-xs text-muted-foreground">
              {t("pricing.selfHosted.desc")}
              <Button className="w-full mt-4 rounded-full" variant="outline" render={<Link href="/self-hosted" />}>
                {t("common.buyLicense")}
              </Button>
            </CardContent>
          </Card>
        </section>
        </FadeIn>

        {/* ── FAQ ── */}
        <FadeIn>
        <section className="container mx-auto px-4 py-24">
          <h2 className="text-3xl font-bold text-center mb-12">FAQ</h2>
          <div className="max-w-2xl mx-auto space-y-3">
            {[
              { q: "Is EGAKU AI free to use?", a: "Yes. 50 free credits per month plus a daily login bonus. Free plan includes image generation (Flux, SDXL) and video generation (LTX, Wan 2.6, up to 15 seconds). Premium models like Veo 3, Flux Pro, and Kling 3.0 require a paid plan starting at ¥480/month." },
              { q: "What AI models are available?", a: "30+ models including Flux Dev, Flux Pro, SDXL, Ideogram v3, Luma Photon, Nano Banana 2, Grok Imagine, GPT Image 2, and video models like Veo 3, Kling 3.0, Seedance 2.0, and Wan 2.6. Plus AI Music Generator. New models are added regularly." },
              { q: "Can I use CivitAI models?", a: "Yes. Basic plan and above can load CivitAI checkpoint models. Browse and search 100K+ community models directly from the generate page." },
              { q: "What tools are included?", a: "Image generation, video generation, Photo Booth, Logo Maker, Meme Generator, Wallpaper Studio, Video Shorts, Storyboard Studio, Face Swap, Character Lock, Style Transfer, Upscale, Background Removal, Inpainting, ControlNet, and Prompt Battle." },
              { q: "Do you support non-English prompts?", a: "Yes. Write prompts in any language. Japanese, Chinese, Korean, Spanish, and more. The AI automatically translates for optimal results." },
              { q: "Is there an API?", a: "Yes. Pro plan and above get REST API access for programmatic image and video generation." },
            ].map((faq, i) => (
              <details key={i} className="group rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <summary className="flex items-center justify-between p-5 cursor-pointer font-medium text-sm text-white/80 hover:text-white transition-colors">
                  {faq.q}
                  <span className="text-white/20 group-open:rotate-180 transition-transform ml-4 flex-shrink-0">&#9660;</span>
                </summary>
                <p className="px-5 pb-5 text-sm text-white/50 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
        </FadeIn>

        {/* ── SEO Links ── */}
        <section className="container mx-auto px-4 py-12 border-t border-white/[0.06]">
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5 text-xs">
            {[
              { label: "Flux AI Generator", href: "/ai/flux-ai-image-generator" },
              { label: "SDXL Generator", href: "/ai/sdxl-image-generator" },
              { label: "SD 3.5 Generator", href: "/ai/stable-diffusion-3-generator" },
              { label: "Anime AI Generator", href: "/ai/anime-ai-art-generator" },
              { label: "Ghibli Style AI", href: "/ai/ghibli-style-ai-art" },
              { label: "AI Video Generator", href: "/ai/ai-video-generator" },
              { label: "AI Image Upscaler", href: "/ai/ai-image-upscaler" },
              { label: "AI Background Remover", href: "/ai/ai-background-remover" },
              { label: "CivitAI Models Online", href: "/ai/civitai-models-online" },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="text-white/25 hover:text-white/60 transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-white/[0.06]">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
              <div>
                <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Product</h4>
                <div className="space-y-2 text-xs text-white/30">
                  <Link href="/generate" className="block hover:text-white/70 transition-colors">Generate</Link>
                  <Link href="/tools" className="block hover:text-white/70 transition-colors">All Tools</Link>
                  <Link href="/gallery" className="block hover:text-white/70 transition-colors">Gallery</Link>
                  <a href="/#pricing" className="block hover:text-white/70 transition-colors">Pricing</a>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Tools</h4>
                <div className="space-y-2 text-xs text-white/30">
                  <Link href="/photo-booth" className="block hover:text-white/70 transition-colors">Photo Booth</Link>
                  <Link href="/logo" className="block hover:text-white/70 transition-colors">Logo Maker</Link>
                  <Link href="/shorts" className="block hover:text-white/70 transition-colors">Video Shorts</Link>
                  <Link href="/storyboard" className="block hover:text-white/70 transition-colors">Storyboard</Link>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Community</h4>
                <div className="space-y-2 text-xs text-white/30">
                  <Link href="/battle" className="block hover:text-white/70 transition-colors">Prompt Battle</Link>
                  <Link href="/referrals" className="block hover:text-white/70 transition-colors">Referrals</Link>
                  <a href="https://discord.gg/YqgYjJFjp2" target="_blank" rel="noopener noreferrer" className="block hover:text-white/70 transition-colors">Discord</a>
                  <a href="https://x.com/Egaku_AI" target="_blank" rel="noopener noreferrer" className="block hover:text-white/70 transition-colors">X (Twitter)</a>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Legal</h4>
                <div className="space-y-2 text-xs text-white/30">
                  <Link href="/terms" className="block hover:text-white/70 transition-colors">Terms of Service</Link>
                  <Link href="/privacy" className="block hover:text-white/70 transition-colors">Privacy Policy</Link>
                  <Link href="/content-policy" className="block hover:text-white/70 transition-colors">Content Policy</Link>
                  <Link href="/contact" className="block hover:text-white/70 transition-colors">Contact</Link>
                </div>
              </div>
            </div>
            <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/25">
              <p>&copy; {new Date().getFullYear()} EGAKU AI. {t("footer.rights")}</p>
              <p>Powered by Veo 3, Grok, Flux, Kling 3.0, Seedance 2.0, and 30+ AI models.</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
