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
            <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90" render={<Link href="/register" />}>
              {t("common.startFree")} — 50 {t("common.credits")}
            </Button>
            <Button size="lg" variant="outline" render={<a href="#pricing" />}>
              {t("hero.viewPricing")}
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required. Start creating in 30 seconds.
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
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-3">How It Works</h2>
          <p className="text-sm text-muted-foreground text-center mb-10">From idea to professional content in 3 steps.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="rounded-xl border border-muted bg-card overflow-hidden hover:border-purple-500/30 transition-colors">
              <div className="aspect-[16/9] bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center relative overflow-hidden">
                <img src="/samples/flux_dev.jpg" alt="Step 1" className="w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                    <p className="text-xs text-white/70">Type your prompt</p>
                    <p className="text-sm text-white font-mono">&quot;futuristic glass skyscraper...&quot;</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">1</div>
                  <h3 className="font-semibold">Describe or Upload</h3>
                </div>
                <p className="text-sm text-muted-foreground">Type a prompt in any language, upload an image, or pick a one-click template. No design skills needed.</p>
              </div>
            </div>
            {/* Step 2 */}
            <div className="rounded-xl border border-muted bg-card overflow-hidden hover:border-pink-500/30 transition-colors">
              <div className="aspect-[16/9] bg-gradient-to-br from-pink-600/20 to-orange-600/20 flex items-center justify-center relative overflow-hidden">
                <div className="grid grid-cols-3 gap-1 p-3 w-full h-full">
                  <div className="rounded bg-purple-500/30 flex items-center justify-center text-[9px] text-white/70 font-medium">Flux Pro</div>
                  <div className="rounded bg-pink-500/30 flex items-center justify-center text-[9px] text-white/70 font-medium">Kling 3.0</div>
                  <div className="rounded bg-cyan-500/30 flex items-center justify-center text-[9px] text-white/70 font-medium">GPT Image</div>
                  <div className="rounded bg-green-500/30 flex items-center justify-center text-[9px] text-white/70 font-medium">CivitAI</div>
                  <div className="rounded bg-amber-500/30 flex items-center justify-center text-[9px] text-white/70 font-medium">Veo 3</div>
                  <div className="rounded bg-red-500/30 flex items-center justify-center text-[9px] text-white/70 font-medium">SDXL</div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold">2</div>
                  <h3 className="font-semibold">Pick a Model</h3>
                </div>
                <p className="text-sm text-muted-foreground">Choose from 25+ AI models. Kling 3.0 for 4K video, Flux for images, CivitAI for 100K+ community models.</p>
              </div>
            </div>
            {/* Step 3 */}
            <div className="rounded-xl border border-muted bg-card overflow-hidden hover:border-cyan-500/30 transition-colors">
              <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                <div className="grid grid-cols-2 gap-1 p-2 w-full h-full">
                  <img src="/samples/portrait.jpg" alt="Result 1" className="rounded object-cover w-full h-full" />
                  <img src="/samples/anime.jpg" alt="Result 2" className="rounded object-cover w-full h-full" />
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-cyan-500 text-white flex items-center justify-center text-xs font-bold">3</div>
                  <h3 className="font-semibold">Download &amp; Share</h3>
                </div>
                <p className="text-sm text-muted-foreground">Get HD images or 4K videos in seconds. Download, share to X, or publish to the community gallery.</p>
              </div>
            </div>
          </div>
          <div className="text-center mt-8">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 px-8" render={<Link href="/register" />}>
              Start Creating Free
            </Button>
          </div>
        </section>

        {/* NEW: Kling 3.0 Announcement Banner */}
        <section className="container mx-auto px-4 py-6">
          <div className="rounded-xl bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 border border-purple-500/30 p-4 sm:p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2.5 py-0.5 rounded-full animate-pulse">NEW</span>
              <span className="text-sm sm:text-base font-bold">Kling 3.0 4K + Kling O3 Now Available</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Native 4K video generation with cinematic quality. Plus Veo 3, GPT Image 2 and 25+ more models.
            </p>
          </div>
        </section>

        {/* AI Models Showcase — card-based like BigMotion */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-center mb-3">25+ AI Models, One Platform</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">The latest and best models — at a fraction of the cost.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
              { name: "Kling 3.0", tag: "4K Video", badge: "NEW", sample: "/samples/kling3_castle.mp4", type: "video" },
              { name: "Kling O3", tag: "4K + Audio", badge: "NEW", sample: "/samples/kling3_cyberpunk.mp4", type: "video" },
              { name: "Flux Pro", tag: "Best Image Quality", badge: "", sample: "/samples/flux_dev.jpg", type: "image" },
              { name: "GPT Image 2", tag: "OpenAI Latest", badge: "NEW", sample: "/samples/gpt_image2.png", type: "image" },
              { name: "Veo 3", tag: "Google Video", badge: "", sample: "/samples/veo3.mp4", type: "video" },
              { name: "Ideogram v3", tag: "Text + Logo", badge: "", sample: "/samples/ideogram.png", type: "image" },
              { name: "CivitAI", tag: "100K+ Community Models", badge: "", sample: "", type: "grid", gridImages: ["/samples/civitai_realistic.jpg","/samples/civitai_anime.jpg","/samples/civitai_fantasy.jpg","/samples/civitai_scifi.jpg"] },
              { name: "SDXL", tag: "Free — 1024px", badge: "Free", sample: "/samples/sdxl.jpg", type: "image" },
              { name: "Wan 2.6", tag: "Free Video", badge: "Free", sample: "/samples/wan26.mp4", type: "video" },
              { name: "Nano Banana 2", tag: "2K Ultra Detail", badge: "", sample: "/samples/nano_banana.png", type: "image" },
            ].map((m) => (
              <Link key={m.name} href="/generate" className="group relative rounded-xl border border-muted bg-card overflow-hidden hover:border-purple-500/40 transition-all hover:shadow-lg">
                {m.badge && (
                  <span className={`absolute top-2 right-2 z-10 text-[9px] font-bold text-white px-2 py-0.5 rounded-full shadow-lg ${m.badge === "NEW" ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-green-600"}`}>
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

        {/* Price Comparison — why EGAKU AI */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-center mb-3">How We Compare</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">Same cutting-edge models. More features. Better price.</p>
          <div className="max-w-3xl mx-auto rounded-xl border border-muted overflow-hidden">
            <div className="grid grid-cols-4 text-center text-[11px] font-semibold bg-muted/50 p-3 border-b border-muted">
              <span className="text-left pl-2">Feature</span>
              <span>Video-only tools</span>
              <span>General AI tools</span>
              <span className="text-purple-400">EGAKU AI</span>
            </div>
            {[
              { feat: "Starting price", c1: "$19-89/mo", c2: "$9-20/mo", egaku: "¥980/mo (~$6.50)" },
              { feat: "Kling 3.0 4K", c1: "Some", c2: "Some", egaku: "Yes" },
              { feat: "Veo 3 / Kling 3.0", c1: "Rare", c2: "Some", egaku: "Yes" },
              { feat: "GPT Image 2", c1: "No", c2: "Some", egaku: "Yes" },
              { feat: "Image models", c1: "3-5", c2: "5-8", egaku: "25+" },
              { feat: "CivitAI (100K+ models)", c1: "No", c2: "No", egaku: "Yes" },
              { feat: "Free tier", c1: "Limited", c2: "Limited", egaku: "50 credits" },
              { feat: "Multi-language prompts", c1: "English only", c2: "English only", egaku: "All languages" },
              { feat: "Vid2Vid style transfer", c1: "Rare", c2: "No", egaku: "Yes" },
              { feat: "Gallery remix", c1: "No", c2: "No", egaku: "Yes" },
            ].map((row, i) => (
              <div key={i} className={`grid grid-cols-4 text-center text-xs p-3 ${i % 2 === 0 ? "bg-card" : "bg-muted/20"}`}>
                <span className="font-medium text-left pl-2">{row.feat}</span>
                <span className="text-muted-foreground">{row.c1}</span>
                <span className="text-muted-foreground">{row.c2}</span>
                <span className="text-purple-400 font-semibold">{row.egaku}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 max-w-3xl mx-auto rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-4 text-center">
            <p className="text-sm font-medium">Regional Pricing Available</p>
            <p className="text-xs text-muted-foreground mt-1">
              Prices are automatically adjusted based on your country — up to 80% off in eligible regions.
              We believe everyone should have access to AI creative tools, regardless of where they live.
            </p>
          </div>
        </section>

        {/* Creative Tools — Main Navigation Hub */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-3">Creative Tools</h2>
          <p className="text-center text-muted-foreground mb-10">Everything you need to create — all in one platform.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {[
              { name: "AI Image Generator", desc: "25+ models including Flux Pro, Kling 3.0, GPT Image 2, SDXL", href: "/generate", icon: "🎨", gradient: "from-purple-600 to-pink-600" },
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

        {/* Features */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-4">
            {t("features.title")}
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-10">Click any feature to try it.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featureKeys.map((key) => {
              const hrefMap: Record<string, string> = {
                txt2img: "/generate",
                img2img: "/generate?remix_mode=img2img",
                style: "/generate?remix_mode=style",
                txt2vid: "/generate",
                img2vid: "/generate?remix_mode=i2v",
                vid2vid: "/vid2vid",
                lipSync: "/lip-sync",
                talkingAvatar: "/talking-avatar",
                loraTraining: "/lora-train",
                characterVideo: "/character-video",
                voiceClone: "/voice-clone",
                upscale: "/generate",
                inpaint: "/generate",
                controlnet: "/generate",
                removeBg: "/generate",
                customModels: "/generate",
                apiAccess: "/settings",
              };
              const href = hrefMap[key] || "/generate";
              const badgeMap: Record<string, string> = {
                vid2vid: "NEW",
                lipSync: "NEW",
                talkingAvatar: "NEW",
                loraTraining: "NEW · Pro",
                characterVideo: "NEW",
                voiceClone: "NEW",
                apiAccess: "Studio",
              };
              const badge = badgeMap[key];
              return (
                <Link key={key} href={href}>
                  <Card className="h-full hover:border-purple-500/50 transition-colors group cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base group-hover:text-purple-400 transition-colors">
                          {t(`features.${key}.title`)}
                        </CardTitle>
                        <span className="text-xs text-muted-foreground group-hover:text-purple-400 transition-colors">→</span>
                      </div>
                      {badge && (
                        <Badge variant="outline" className="w-fit text-[10px] border-purple-500 text-purple-400">
                          {badge}
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

        {/* FAQ Section */}
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
              <p className="text-[10px]">Powered by Flux, Kling 3.0, Veo 3, GPT Image 2, SDXL, and 25+ AI models.</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
