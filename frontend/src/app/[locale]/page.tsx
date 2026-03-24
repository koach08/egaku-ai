import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { WebsiteJsonLd } from "@/components/json-ld";
import { ShowcaseGallery } from "@/components/showcase-gallery";

const planKeys = ["free", "lite", "basic", "pro", "unlimited", "studio"] as const;
const planPrices: Record<string, string> = {
  free: "0",
  lite: "480",
  basic: "980",
  pro: "2,980",
  unlimited: "5,980",
  studio: "9,980",
};
const popularPlan = "pro";

const featureKeys = [
  "txt2img", "img2img", "style", "txt2vid", "img2vid", "vid2vid",
  "upscale", "inpaint", "controlnet", "removeBg", "customModels", "apiAccess",
] as const;

export default function LandingPage() {
  const t = useTranslations();

  return (
    <>
      <WebsiteJsonLd />
      <Header />
      <main>
        {/* Hero */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {t("hero.subtitle")}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
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
        </section>

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

        {/* Features */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t("features.title")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featureKeys.map((key) => (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {t(`features.${key}.title`)}
                  </CardTitle>
                  {key === "vid2vid" && (
                    <Badge variant="outline" className="w-fit text-[10px] border-amber-500 text-amber-500">
                      {t("common.soon")}
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
            ))}
          </div>
        </section>

        {/* Showcase Gallery */}
        <ShowcaseGallery title={t("gallery.title")} />

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
              const isPopular = planKey === popularPlan;
              const price = planPrices[planKey];
              const features = t.raw(`plans.${planKey}.features`) as string[];
              return (
                <Card
                  key={planKey}
                  className={
                    isPopular
                      ? "border-purple-500 shadow-lg shadow-purple-500/20"
                      : ""
                  }
                >
                  <CardHeader className="text-center">
                    {isPopular && (
                      <Badge className="mx-auto mb-2 bg-purple-500">
                        {t("common.mostPopular")}
                      </Badge>
                    )}
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
                      variant={isPopular ? "default" : "outline"}
                      render={<Link href={price === "0" ? "/register" : `/register?plan=${planKey}`} />}
                    >
                      {price === "0"
                        ? t("common.startFree")
                        : t("common.subscribe")}
                    </Button>
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

          {/* Adult Expression hint */}
          <p className="mt-6 text-center text-xs text-muted-foreground/60">
            Looking for unrestricted creative expression?{" "}
            <Link href="/adult" className="underline underline-offset-2 hover:text-muted-foreground transition-colors">
              Adult Expression plans
            </Link>{" "}
            are available for verified users (18+).
          </p>
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
              href="/ai/unrestricted-ai-art-generator"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Unrestricted AI Art
            </Link>
            <Link
              href="/adult"
              className="text-muted-foreground/60 hover:text-pink-400/80 transition-colors"
            >
              Adult Expression (18+)
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
