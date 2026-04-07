"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const LOCALE_LABELS: Record<string, string> = {
  en: "EN",
  ja: "JA",
  es: "ES",
  zh: "ZH",
  pt: "PT",
};

const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  ja: "日本語",
  es: "Español",
  zh: "中文",
  pt: "Português",
};

function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-muted cursor-pointer">
        {LOCALE_LABELS[locale] || "EN"}
        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(LOCALE_NAMES).map(([code, name]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => switchLocale(code)}
            className={locale === code ? "bg-muted" : ""}
          >
            {name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const { user, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            EGAKU AI
          </span>
          <Badge variant="secondary" className="text-xs">
            {t("common.beta")}
          </Badge>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/explore" className="hover:text-foreground/80">
            {t("nav.explore")}
          </Link>
          <Link href="/generate" className="hover:text-foreground/80">
            {t("nav.generate")}
          </Link>
          <Link href="/storyboard" className="hover:text-foreground/80 flex items-center gap-1">
            Storyboard
          </Link>
          <Link href="/photo-booth" className="hover:text-foreground/80">
            Photo Booth
          </Link>
          <Link href="/shorts" className="hover:text-foreground/80">
            Shorts
          </Link>
          <Link href="/battle" className="hover:text-foreground/80 flex items-center gap-1">
            Battle
            <span className="text-[9px] bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400 px-1 rounded">New</span>
          </Link>
          <Link href="/gallery" className="hover:text-foreground/80">
            {t("nav.gallery")}
          </Link>
          <Link href="/#pricing" className="hover:text-foreground/80">
            {t("nav.pricing")}
          </Link>
          <a href="https://discord.gg/c7PhS4E7" target="_blank" rel="noopener noreferrer" className="hover:text-foreground/80 flex items-center gap-1">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
            Discord
          </a>
          {user && (
            <>
              <Link href="/adult" className="hover:text-foreground/80 text-pink-400/80 hover:text-pink-400">
                18+
              </Link>
              <Link href="/settings" className="hover:text-foreground/80">
                {t("nav.settings")}
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <LanguageSwitcher />

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 -mr-1"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Desktop user menu */}
          {loading ? null : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-8 w-8 rounded-full cursor-pointer hidden md:block">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  {user.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/explore" />}>
                  {t("nav.explore")}
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/generate" />}>
                  {t("nav.generate")}
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/storyboard" />}>
                  Storyboard
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/photo-booth" />}>
                  Photo Booth
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/meme" />}>
                  Meme Generator
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/logo" />}>
                  Logo Maker
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/wallpaper" />}>
                  Wallpaper
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/battle" />}>
                  Prompt Battle
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/gallery" />}>
                  {t("nav.gallery")}
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/my-gallery" />}>
                  {t("nav.myGenerations")}
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/adult" />}>
                  <span className="text-pink-400">18+ Adult</span>
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/settings" />}>
                  {t("nav.settings")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  {t("common.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" render={<Link href="/login" />}>
                {t("common.signIn")}
              </Button>
              <Button render={<Link href="/register" />}>
                {t("common.getStarted")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="md:hidden border-t bg-background px-4 py-3 space-y-1">
          <Link href="/explore" onClick={() => setMobileOpen(false)} className="block py-2 text-sm hover:text-foreground/80">
            {t("nav.explore")}
          </Link>
          <Link href="/generate" onClick={() => setMobileOpen(false)} className="block py-2 text-sm hover:text-foreground/80">
            {t("nav.generate")}
          </Link>
          <Link href="/storyboard" onClick={() => setMobileOpen(false)} className="block py-2 text-sm hover:text-foreground/80">
            Storyboard
          </Link>
          <Link href="/photo-booth" onClick={() => setMobileOpen(false)} className="block py-2 text-sm hover:text-foreground/80">
            Photo Booth
          </Link>
          <Link href="/meme" onClick={() => setMobileOpen(false)} className="block py-2 text-sm hover:text-foreground/80">
            Meme Generator
          </Link>
          <Link href="/logo" onClick={() => setMobileOpen(false)} className="block py-2 text-sm hover:text-foreground/80">
            Logo Maker
          </Link>
          <Link href="/wallpaper" onClick={() => setMobileOpen(false)} className="block py-2 text-sm hover:text-foreground/80">
            Wallpaper
          </Link>
          <Link href="/battle" onClick={() => setMobileOpen(false)} className="block py-2 text-sm hover:text-foreground/80">
            Prompt Battle
          </Link>
          <Link href="/gallery" onClick={() => setMobileOpen(false)} className="block py-2 text-sm hover:text-foreground/80">
            {t("nav.gallery")}
          </Link>
          {user && (
            <Link href="/my-gallery" onClick={() => setMobileOpen(false)} className="block py-2 text-sm hover:text-foreground/80">
              {t("nav.myGenerations")}
            </Link>
          )}
          <Link href="/#pricing" onClick={() => setMobileOpen(false)} className="block py-2 text-sm hover:text-foreground/80">
            {t("nav.pricing")}
          </Link>
          <a href="https://discord.gg/c7PhS4E7" target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} className="block py-2 text-sm hover:text-foreground/80">
            Discord Community
          </a>
          {user && (
            <>
              <Link href="/adult" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-pink-400/80 hover:text-pink-400">
                18+ Adult Expression
              </Link>
              <Link href="/settings" onClick={() => setMobileOpen(false)} className="block py-2 text-sm hover:text-foreground/80">
                {t("nav.settings")}
              </Link>
            </>
          )}
          <div className="pt-2 border-t mt-2">
            {user ? (
              <button onClick={() => { signOut(); setMobileOpen(false); }} className="block py-2 text-sm text-red-400 hover:text-red-300">
                {t("common.signOut")} ({user.email})
              </button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                  {t("common.signIn")}
                </Button>
                <Button size="sm" render={<Link href="/register" />}>
                  {t("common.getStarted")}
                </Button>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
