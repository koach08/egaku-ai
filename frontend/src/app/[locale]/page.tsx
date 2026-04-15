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
  "upscale", "inpaint", "controlnet", "removeBg", "customModels", "apiAccess",
] as const;

export default function LandingPage() {
  const t = useTranslations();

  return (
    <>
      <WebsiteJsonLd />
      <Header />
      <main>
        <AnnouncementBanner location="home" />
        {/* Hero */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {t("hero.subtitle")}
          </p>
          {/* Free Generation — try before signup */}
          <div className="mt-10 max-w-2xl mx-auto">
            <AnonGenerator />
          </div>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="text-lg px-8 py-6" render={<Link href="/register" />}>
              {t("common.startFree")} — 50 {t("common.credits")}
            </Button>
            <Button size="lg" variant="outline" render={<a href="#pricing" />}>
              {t("hero.viewPricing")}
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required. Create your first image in 30 seconds.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {[
              { label: "⚔️ Prompt Battle", href: "/battle", color: "from-red-500/20 to-orange-500/20 text-red-400" },
              { label: "📸 Photo Booth", href: "/photo-booth", color: "from-green-500/20 to-emerald-500/20 text-green-400" },
              { label: "😂 Meme Generator", href: "/meme", color: "from-yellow-500/20 to-amber-500/20 text-yellow-400" },
              { label: "✏️ Logo Maker", href: "/logo", color: "from-violet-500/20 to-purple-500/20 text-violet-400" },
              { label: "📱 Video Shorts", href: "/shorts", color: "from-pink-500/20 to-red-500/20 text-pink-400" },
              { label: "🖼️ Wallpaper", href: "/wallpaper", color: "from-cyan-500/20 to-blue-500/20 text-cyan-400" },
            ].map((f) => (
              <Link
                key={f.label}
                href={f.href}
                className={`text-xs px-3 py-1.5 rounded-full bg-gradient-to-r ${f.color} border border-white/5 hover:border-white/20 transition-colors`}
              >
                {f.label}
              </Link>
            ))}
          </div>
          <div className="mt-3">
            <Link href="/tools" className="text-xs text-muted-foreground hover:text-purple-400 transition-colors underline underline-offset-4">
              View all 20+ AI tools →
            </Link>
          </div>
        </section>

        {/* Community Gallery — split into Images + Videos so visitors instantly see both capabilities */}
        <ShowcaseGallery title={t("gallery.imagesTitle")} filter="image" maxItems={24} />
        <ShowcaseGallery title={t("gallery.videosTitle")} filter="video" maxItems={18} />

        {/* How it works */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
            <div>
              <div className="text-4xl mb-3">1</div>
              <h3 className="font-semibold mb-1">Sign Up Free</h3>
              <p className="text-sm text-muted-foreground">Create an account in 10 seconds with Google or email</p>
            </div>
            <div>
              <div className="text-4xl mb-3">2</div>
              <h3 className="font-semibold mb-1">Type Your Prompt</h3>
              <p className="text-sm text-muted-foreground">Describe what you want to create — any style, any subject</p>
            </div>
            <div>
              <div className="text-4xl mb-3">3</div>
              <h3 className="font-semibold mb-1">Generate & Download</h3>
              <p className="text-sm text-muted-foreground">Get your image in seconds. Download in full resolution</p>
            </div>
          </div>
        </section>

        {/* Social Proof / Models */}
        <section className="container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-4">
              Powered by the best AI models
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-muted-foreground">
              <span className="text-lg font-semibold text-purple-400">Sora 2</span>
              <span className="text-lg font-semibold text-purple-400">Veo 3</span>
              <span className="text-lg font-semibold text-purple-400">Seedance 2</span>
              <span className="text-lg font-semibold text-purple-400">Nano Banana 2</span>
              <span className="text-lg font-semibold text-purple-400">Grok Imagine</span>
              <span className="text-lg font-semibold">Flux</span>
              <span className="text-lg font-semibold">SDXL</span>
              <span className="text-lg font-semibold">Kling 2.5</span>
              <span className="text-lg font-semibold">CivitAI</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto text-center">
            <div>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                25+
              </p>
              <p className="text-sm text-muted-foreground">AI Models</p>
            </div>
            <div>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                8
              </p>
              <p className="text-sm text-muted-foreground">Style Presets</p>
            </div>
            <div>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                1000+
              </p>
              <p className="text-sm text-muted-foreground">CivitAI LoRAs</p>
            </div>
            <div>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Free
              </p>
              <p className="text-sm text-muted-foreground">To Start</p>
            </div>
          </div>
        </section>

        {/* Creative Tools — Main Navigation Hub */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-3">Creative Tools</h2>
          <p className="text-center text-muted-foreground mb-10">Everything you need to create — all in one platform.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {[
              { name: "AI Image Generator", desc: "20+ models including Flux Pro, Sora 2, SDXL", href: "/generate", icon: "🎨", gradient: "from-purple-600 to-pink-600" },
              { name: "Prompt Battle", desc: "Challenge friends to AI art duels — vote for the winner!", href: "/battle", icon: "⚔️", gradient: "from-red-600 to-orange-600" },
              { name: "Photo Booth", desc: "Selfie → professional portrait for LinkedIn, dating, social", href: "/photo-booth", icon: "📸", gradient: "from-green-600 to-emerald-600" },
              { name: "Logo Maker", desc: "Brand name → 3 professional logo variations instantly", href: "/logo", icon: "✏️", gradient: "from-violet-600 to-purple-600" },
              { name: "Meme Generator", desc: "AI creates the image, you add the punchline", href: "/meme", icon: "😂", gradient: "from-yellow-600 to-amber-600" },
              { name: "Video Shorts", desc: "TikTok / Reels / Shorts vertical video in seconds", href: "/shorts", icon: "📱", gradient: "from-pink-600 to-red-600" },
              { name: "Wallpaper Generator", desc: "Perfect wallpapers for iPhone, Android, Desktop, 4K", href: "/wallpaper", icon: "🖼️", gradient: "from-cyan-600 to-blue-600" },
              { name: "Storyboard Studio", desc: "Multi-scene video with BGM and narration", href: "/storyboard", icon: "🎞️", gradient: "from-amber-600 to-orange-600" },
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

        {/* Features */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t("features.title")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featureKeys.map((key) => {
              const href =
                key === "vid2vid" ? "/vid2vid" :
                key === "lipSync" ? "/lip-sync" :
                key === "talkingAvatar" ? "/talking-avatar" :
                key === "loraTraining" ? "/lora-train" :
                key === "characterVideo" ? "/character-video" :
                key === "voiceClone" ? "/voice-clone" :
                key === "txt2vid" || key === "img2vid" ? "/generate" :
                key === "apiAccess" ? "/settings" :
                "/generate";
              return (
                <Link key={key} href={href}>
                  <Card className="h-full hover:border-purple-500/50 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {t(`features.${key}.title`)}
                      </CardTitle>
                      {key === "vid2vid" && (
                        <Badge variant="outline" className="w-fit text-[10px] border-purple-500 text-purple-400">
                          New · Pro
                        </Badge>
                      )}
                      {(key === "lipSync" || key === "talkingAvatar") && (
                        <Badge variant="outline" className="w-fit text-[10px] border-purple-500 text-purple-400">
                          New
                        </Badge>
                      )}
                      {key === "loraTraining" && (
                        <Badge variant="outline" className="w-fit text-[10px] border-purple-500 text-purple-400">
                          NEW · Pro差別化
                        </Badge>
                      )}
                      {key === "characterVideo" && (
                        <Badge variant="outline" className="w-fit text-[10px] border-purple-500 text-purple-400">
                          NEW
                        </Badge>
                      )}
                      {key === "voiceClone" && (
                        <Badge variant="outline" className="w-fit text-[10px] border-purple-500 text-purple-400">
                          NEW
                        </Badge>
                      )}
                      {key === "apiAccess" && (
                        <Badge variant="outline" className="w-fit text-[10px]">
                          Studio
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      {t(`features.${key}.desc`)}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-4">
            {t("pricing.title")}
          </h2>
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

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              { q: "Is EGAKU AI free to use?", a: "Yes. You get 50 free credits per month and 1 daily login bonus credit. No credit card required. Free plan includes access to Flux, SDXL, and other models." },
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
        <footer className="border-t py-8 text-sm text-muted-foreground">
          <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>
              &copy; {new Date().getFullYear()} EGAKU AI.{" "}
              {t("footer.rights")}
            </p>
            <div className="flex gap-4">
              <a
                href="https://discord.gg/YqgYjJFjp2"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Discord
              </a>
              <Link
                href="/terms"
                className="hover:text-foreground transition-colors"
              >
                {t("footer.terms")}
              </Link>
              <Link
                href="/privacy"
                className="hover:text-foreground transition-colors"
              >
                {t("footer.privacy")}
              </Link>
              <Link
                href="/content-policy"
                className="hover:text-foreground transition-colors"
              >
                Content Policy
              </Link>
              <Link
                href="/adult"
                className="hover:text-pink-400/70 transition-colors"
              >
                18+
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
