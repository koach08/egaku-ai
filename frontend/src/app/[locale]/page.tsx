import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { WebsiteJsonLd } from "@/components/json-ld";
import { ShowcaseGallery } from "@/components/showcase-gallery";
import { AnonGenerator } from "@/components/anon-generator";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { HeroVideo } from "@/components/hero-video";
import { FadeIn } from "@/components/fade-in";
import { LiveStats } from "@/components/live-stats";

const planKeys = ["free", "lite", "basic", "pro", "unlimited", "studio"] as const;
const planPrices: Record<string, string> = {
  free: "0",
  lite: "480",
  basic: "980",
  pro: "2,980",
  unlimited: "5,980",
  studio: "9,980",
};


const featureKeys = [
  "txt2img", "img2img", "style", "txt2vid", "img2vid", "vid2vid",
  "lipSync", "talkingAvatar", "loraTraining", "characterVideo", "voiceClone",
  "upscale", "inpaint", "controlnet", "removeBg", "customModels",
] as const;

export default function LandingPage() {
  const t = useTranslations();

  return (
    <>
      <WebsiteJsonLd />
      <Header />
      <main>
        <AnnouncementBanner location="home" />
        {/* Hero — video background */}
        <section className="relative overflow-hidden">
          {/* Video BG — random on each visit */}
          <HeroVideo />

          <div className="relative z-10 container mx-auto px-4 pt-28 pb-20 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-tight">
              {t("hero.title")}
            </h1>
            <p className="mx-auto mt-8 max-w-xl text-lg text-muted-foreground leading-relaxed">
              {t("hero.subtitle")}
            </p>

            {/* Free Generation */}
            <div className="mt-12 max-w-2xl mx-auto">
              <AnonGenerator />
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="text-lg px-8 py-6 bg-white text-black hover:bg-white/90 font-semibold" render={<Link href="/register" />}>
                {t("common.startFree")} — 50 {t("common.credits")}
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 hover:border-white/40" render={<a href="#pricing" />}>
                {t("hero.viewPricing")}
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground/70">
              No credit card required.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
              {[
                { label: "Prompt Battle", href: "/battle" },
                { label: "Photo Booth", href: "/photo-booth" },
                { label: "Meme Generator", href: "/meme" },
                { label: "Logo Maker", href: "/logo" },
                { label: "Video Shorts", href: "/shorts" },
                { label: "Wallpaper", href: "/wallpaper" },
              ].map((f) => (
                <Link
                  key={f.label}
                  href={f.href}
                  className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-muted-foreground hover:text-foreground hover:border-white/30 transition-colors"
                >
                  {f.label}
                </Link>
              ))}
            </div>
            <div className="mt-3">
              <Link href="/tools" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors">
                All 20+ tools →
              </Link>
            </div>
          </div>
        </section>

        {/* Community Gallery — split into Images + Videos so visitors instantly see both capabilities */}
        <FadeIn>
          <ShowcaseGallery title={t("gallery.imagesTitle")} filter="image" maxItems={24} />
        </FadeIn>
        <FadeIn delay={100}>
          <ShowcaseGallery title={t("gallery.videosTitle")} filter="video" maxItems={18} />
        </FadeIn>

        {/* AI Models Showcase */}
        <FadeIn>
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-center mb-4">30+ AI Models, One Platform</h2>
          <p className="text-sm text-muted-foreground text-center mb-12 max-w-lg mx-auto">Anyone can create. The best models at a fraction of the cost.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
              { name: "Veo 3", tag: "Google Video + Audio", badge: "HOT", sample: "/samples/veo3.mp4", type: "video" },
              { name: "Grok Imagine", tag: "xAI Image + Video", badge: "NEW", sample: "/samples/grok.jpg", type: "image" },
              { name: "Kling 3.0", tag: "4K Cinematic Video", badge: "NEW", sample: "/samples/kling3_castle.mp4", type: "video" },
              { name: "GPT Image 2", tag: "OpenAI Latest", badge: "", sample: "/samples/gpt_image2.png", type: "image" },
              { name: "Flux Pro", tag: "Best Image Quality", badge: "", sample: "/samples/flux_dev.jpg", type: "image" },
              { name: "Ideogram v3", tag: "Text + Logo", badge: "", sample: "/samples/ideogram.png", type: "image" },
              { name: "Sora 2", tag: "OpenAI Cinematic Video", badge: "", sample: "/samples/kling3_cyberpunk.mp4", type: "video" },
              { name: "CivitAI", tag: "100K+ Community Models", badge: "", sample: "", type: "grid", gridImages: ["/samples/civitai_realistic.jpg","/samples/civitai_anime.jpg","/samples/civitai_fantasy.jpg","/samples/civitai_scifi.jpg"] },
              { name: "Nano Banana 2", tag: "Google 4K Ultra", badge: "", sample: "/samples/nano_banana.png", type: "image" },
              { name: "Wan 2.6", tag: "Free Video (NSFW OK)", badge: "Free", sample: "/samples/wan26.mp4", type: "video" },
              { name: "Luma Photon", tag: "Cinematic Lighting", badge: "", sample: "/samples/flux_dev.jpg", type: "image" },
              { name: "SDXL", tag: "Free 1024px", badge: "Free", sample: "/samples/sdxl.jpg", type: "image" },
            ].map((m) => (
              <Link key={m.name} href="/generate" className="group relative rounded-xl border border-muted bg-card overflow-hidden hover:border-purple-500/40 transition-all hover:shadow-lg">
                {m.badge && (
                  <span className={`absolute top-2 right-2 z-10 text-[9px] font-semibold px-2 py-0.5 rounded-full ${m.badge === "HOT" ? "bg-white text-black" : m.badge === "Free" ? "bg-green-600/80 text-white" : "bg-white/15 text-white backdrop-blur-sm"}`}>
                    {m.badge}
                  </span>
                )}
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  {m.type === "video" ? (
                    <video src={m.sample} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                  ) : m.type === "grid" ? (
                    <div className="w-full h-full grid grid-cols-2 gap-0.5 p-0.5 bg-muted">
                      {((m as Record<string, unknown>).gridImages as string[] || []).map((src, gi) => (
                        <img key={gi} src={src} alt={`${m.name} sample ${gi+1}`} className="w-full h-full object-cover" loading="lazy" />
                      ))}
                    </div>
                  ) : m.type === "none" ? (
                    <div className={`w-full h-full bg-gradient-to-br ${"color" in m ? (m as unknown as {color:string}).color : "from-gray-600 to-slate-600"} flex items-center justify-center`}>
                      <span className="text-white/60 text-2xl font-bold">{m.name.charAt(0)}</span>
                    </div>
                  ) : (
                    <img src={m.sample} alt={`${m.name} sample`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold group-hover:text-purple-400 transition-colors">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground">{m.tag}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/generate" className="text-sm text-purple-400 hover:underline">
              Try all models free →
            </Link>
          </div>
          <LiveStats />
        </section>
        </FadeIn>

        {/* Creative Tools */}
        <FadeIn>
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-3">Creative Tools</h2>
          <p className="text-center text-muted-foreground mb-10">Everything you need to create — all in one platform.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {[
              { name: "AI Image Generator", desc: "30+ models: Flux Pro, Grok, Kling 3.0, GPT Image 2, Ideogram", href: "/generate", icon: "🎨", gradient: "from-purple-600 to-pink-600" },
              { name: "Prompt Battle", desc: "Challenge friends to AI art duels — vote for the winner!", href: "/battle", icon: "⚔️", gradient: "from-red-600 to-orange-600" },
              { name: "Photo Booth", desc: "Selfie → professional portrait for LinkedIn, dating, social", href: "/photo-booth", icon: "📸", gradient: "from-green-600 to-emerald-600" },
              { name: "Logo Maker", desc: "Brand name → 3 professional logo variations instantly", href: "/logo", icon: "✏️", gradient: "from-violet-600 to-purple-600" },
              { name: "Meme Generator", desc: "AI creates the image, you add the punchline", href: "/meme", icon: "😂", gradient: "from-yellow-600 to-amber-600" },
              { name: "Video Shorts", desc: "TikTok / Reels / Shorts vertical video in seconds", href: "/shorts", icon: "📱", gradient: "from-pink-600 to-red-600" },
              { name: "Wallpaper Generator", desc: "Perfect wallpapers for iPhone, Android, Desktop, 4K", href: "/wallpaper", icon: "🖼️", gradient: "from-cyan-600 to-blue-600" },
              { name: "Storyboard Studio", desc: "Multi-scene video with BGM and narration", href: "/storyboard", icon: "🎞️", gradient: "from-amber-600 to-orange-600" },
              { name: "Product Studio", desc: "Product photo → professional ad images for Amazon, Instagram, Shopify", href: "/product-studio", icon: "📦", gradient: "from-emerald-600 to-teal-600" },
              { name: "Short Story", desc: "Story idea → AI splits into scenes → generates visuals for TikTok/Reels", href: "/short-story", icon: "📖", gradient: "from-indigo-600 to-blue-600" },
              { name: "Explore Gallery", desc: "Browse 200+ community creations, remix any prompt", href: "/gallery", icon: "🌐", gradient: "from-gray-600 to-slate-600" },
            ].map((tool) => (
              <Link
                key={tool.name}
                href={tool.href}
                className="group relative overflow-hidden rounded-xl border border-muted p-5 hover:border-purple-500/30 transition-all hover:shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl flex-shrink-0">{tool.icon}</span>
                  <div>
                    <h3 className="font-bold text-sm group-hover:text-purple-400 transition-colors">{tool.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{tool.desc}</p>
                  </div>
                </div>
                <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
              </Link>
            ))}
          </div>
        </section>
        </FadeIn>

        {/* Pricing */}
        <FadeIn>
        <section id="pricing" className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-4">
            {t("pricing.title")}
          </h2>
          <div className="text-center mb-2">
            <span className="inline-block text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 rounded-full">
              🎉 LAUNCH50 — 初月50%OFF (先着100名)
            </span>
          </div>
          <p className="text-center text-sm text-muted-foreground mb-12">
            Regional pricing available — up to 80% off based on your location.
            Discount applied automatically at checkout.
          </p>
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
            {planKeys.map((planKey) => {
              const price = planPrices[planKey];
              const features = t.raw(`plans.${planKey}.features`) as string[];
              return (
                <Card
                  key={planKey}
                  className=""
                >
                  <CardHeader className="text-center">
                    <CardTitle>{t(`plans.${planKey}.name`)}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">
                        {price === "0"
                          ? t("common.free")
                          : `¥${price}`}
                      </span>
                      {price !== "0" && (
                        <span className="text-muted-foreground">
                          {" "}
                          {t("common.perMonth")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t(`plans.${planKey}.credits`)} {t("common.credits")}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {features.map((f: string) => (
                        <li key={f} className="flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">
                            &#10003;
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full mt-6"
                      variant="outline"
                      render={<Link href={price === "0" ? "/register" : `/register?plan=${planKey}`} />}
                    >
                      {price === "0"
                        ? t("common.startFree")
                        : t("common.subscribe")}
                    </Button>
                    {price !== "0" && (
                      <Link
                        href={`/register?plan=${planKey}&crypto=1`}
                        className="block w-full text-center text-[10px] text-muted-foreground hover:text-foreground mt-2 py-1 border border-muted rounded transition-colors"
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
          <Card className="mt-8 max-w-md mx-auto border-dashed">
            <CardHeader className="text-center">
              <CardTitle>{t("pricing.selfHosted.title")}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">¥4,980</span>
                <span className="text-muted-foreground">
                  {" "}
                  {t("common.oneTime")}
                </span>
              </div>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              {t("pricing.selfHosted.desc")}
              <br />
              {t("pricing.selfHosted.sub")}
              <Button
                className="w-full mt-4"
                variant="outline"
                render={<Link href="/self-hosted" />}
              >
                {t("common.buyLicense")}
              </Button>
            </CardContent>
          </Card>

        </section>
        </FadeIn>

        {/* FAQ Section */}
        <FadeIn>
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              { q: "Is EGAKU AI free to use?", a: "Yes. 50 free credits/month + daily login bonus. Free plan includes image generation (Flux, SDXL) AND video generation (LTX, Wan 2.1/2.6 — up to 15 seconds). Premium models (Veo 3, Flux Pro, Kling 3.0, GPT Image 2) require a paid plan from ¥480/mo." },
              { q: "What AI models are available?", a: "We offer 20+ models including Flux Dev, Flux Pro, SDXL, Ideogram v3, Luma Photon, Nano Banana 2, Grok Imagine, and video models like Kling 2.5, Luma Dream Machine, and more. New models are added regularly." },
              { q: "Can I use CivitAI models?", a: "Yes. Basic plan and above can use CivitAI checkpoint models. Browse and search models directly from the generate page." },
              { q: "What tools are included?", a: "Image generation, video generation, Photo Booth, Logo Maker, Meme Generator, Wallpaper Generator, Video Shorts, Storyboard Studio, Face Swap, Character Lock, Style Transfer, Upscale, Background Removal, Inpainting, ControlNet, and Prompt Battle." },
              { q: "Do you support non-English prompts?", a: "Yes. Write prompts in any language — Japanese, Chinese, Korean, Spanish, etc. The AI automatically translates for optimal results." },
              { q: "Is there an API?", a: "Yes. Pro plan and above get REST API access. Generate images, videos, upscale, and more programmatically with API key authentication." },
            ].map((faq, i) => (
              <details key={i} className="group rounded-lg border border-muted bg-card">
                <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-sm hover:text-purple-400 transition-colors">
                  {faq.q}
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
        </FadeIn>

        {/* SEO Internal Links */}
        <section className="container mx-auto px-4 py-12 border-t">
          <h2 className="text-xl font-bold mb-6 text-center">
            AI Tools & Models
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 text-sm">
            <Link
              href="/ai/flux-ai-image-generator"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Flux AI Generator
            </Link>
            <Link
              href="/ai/sdxl-image-generator"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              SDXL Generator
            </Link>
            <Link
              href="/ai/stable-diffusion-3-generator"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              SD 3.5 Generator
            </Link>
            <Link
              href="/ai/anime-ai-art-generator"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Anime AI Generator
            </Link>
            <Link
              href="/ai/ghibli-style-ai-art"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Ghibli Style AI
            </Link>
            <Link
              href="/ai/ai-video-generator"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              AI Video Generator
            </Link>
            <Link
              href="/ai/ai-image-upscaler"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              AI Image Upscaler
            </Link>
            <Link
              href="/ai/ai-background-remover"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              AI Background Remover
            </Link>
            <Link
              href="/ai/civitai-models-online"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              CivitAI Models Online
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t mt-16">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Product</h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <Link href="/generate" className="block hover:text-foreground transition-colors">Generate</Link>
                  <Link href="/tools" className="block hover:text-foreground transition-colors">All Tools</Link>
                  <Link href="/gallery" className="block hover:text-foreground transition-colors">Gallery</Link>
                  <a href="/#pricing" className="block hover:text-foreground transition-colors">Pricing</a>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Tools</h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <Link href="/photo-booth" className="block hover:text-foreground transition-colors">Photo Booth</Link>
                  <Link href="/logo" className="block hover:text-foreground transition-colors">Logo Maker</Link>
                  <Link href="/shorts" className="block hover:text-foreground transition-colors">Video Shorts</Link>
                  <Link href="/storyboard" className="block hover:text-foreground transition-colors">Storyboard</Link>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Community</h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <Link href="/battle" className="block hover:text-foreground transition-colors">Prompt Battle</Link>
                  <Link href="/referrals" className="block hover:text-foreground transition-colors">Referrals</Link>
                  <a href="https://discord.gg/YqgYjJFjp2" target="_blank" rel="noopener noreferrer" className="block hover:text-foreground transition-colors">Discord</a>
                  <a href="https://x.com/Egaku_AI" target="_blank" rel="noopener noreferrer" className="block hover:text-foreground transition-colors">X (Twitter)</a>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Legal</h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <Link href="/terms" className="block hover:text-foreground transition-colors">Terms of Service</Link>
                  <Link href="/privacy" className="block hover:text-foreground transition-colors">Privacy Policy</Link>
                  <Link href="/content-policy" className="block hover:text-foreground transition-colors">Content Policy</Link>
                  <Link href="/contact" className="block hover:text-foreground transition-colors">Contact Us</Link>
                </div>
              </div>
            </div>
            <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} EGAKU AI. {t("footer.rights")}</p>
              <p className="text-[10px]">Powered by Veo 3, Grok, Flux, Kling 3.0, Sora 2, and 30+ AI models.</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
