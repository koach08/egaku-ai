import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@/components/analytics";
import { CookieConsent } from "@/components/cookie-consent";
import { MaintenanceBanner } from "@/components/maintenance-banner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "EGAKU AI - Free AI Image & Video Generator | Flux, SDXL, Stable Diffusion",
    template: "%s | EGAKU AI",
  },
  description:
    "Free AI image generator with 15+ models including Flux, SDXL, SD 3.5, and CivitAI custom models. Text-to-image, image-to-video, style transfer, upscaling, inpainting & background removal. Full creative freedom. No download required.",
  keywords: [
    "AI image generator", "AI art generator", "text to image", "AI画像生成",
    "Flux AI", "SDXL", "Stable Diffusion", "free AI art",
    "CivitAI models", "CivitAI LoRA", "custom AI models", "CivitAI browser",
    "unrestricted AI generator", "AI art generator free", "AI video generator", "text to video AI",
    "style transfer AI", "image upscaler AI", "background remover AI", "inpainting AI",
    "anime AI generator", "AI illustration", "LoRA models", "Flux LoRA",
    "Ghibli style AI", "realistic AI art", "AI portrait generator",
    "AI画像", "画像生成AI", "無料AI画像生成", "AI動画生成",
    "CivitAIモデル", "LoRAモデル", "AI画像生成 無制限",
    "generador de imagenes IA", "arte IA gratis", "generador de video IA",
    "AI图片生成", "AI绘画", "免费AI图片生成器", "AI视频生成",
  ],
  metadataBase: new URL("https://egaku-ai.com"),
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      ja: "/ja",
      es: "/es",
      zh: "/zh",
      pt: "/pt",
    },
  },
  openGraph: {
    title: "EGAKU AI - Free AI Image & Video Generator",
    description:
      "Create stunning AI art with 15+ models. Flux, SDXL, SD 3.5, CivitAI LoRA. Text-to-image, video, style transfer, upscaling & more. Free to start.",
    url: "https://egaku-ai.com",
    siteName: "EGAKU AI",
    type: "website",
    locale: "en_US",
    alternateLocale: ["ja_JP", "es_ES", "zh_CN", "pt_BR"],
    images: [
      {
        url: "https://egaku-ai.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "EGAKU AI - AI Image & Video Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EGAKU AI - Free AI Image & Video Generator",
    description:
      "Create stunning AI art with 15+ models. Flux, SDXL, CivitAI LoRA. Free to start.",
    images: ["https://egaku-ai.com/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="dark" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17588553167" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'analytics_storage': 'denied',
              });
              gtag('js', new Date());
              gtag('config', 'AW-17588553167');
              gtag('config', 'G-6YZSPFFDYQ');
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <MaintenanceBanner />
        <GoogleAnalytics />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
