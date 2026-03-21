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
          <Link href="/gallery" className="hover:text-foreground/80">
            {t("nav.gallery")}
          </Link>
          <Link href="/#pricing" className="hover:text-foreground/80">
            {t("nav.pricing")}
          </Link>
          {user && (
            <Link href="/settings" className="hover:text-foreground/80">
              {t("nav.settings")}
            </Link>
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
                <DropdownMenuItem render={<Link href="/gallery" />}>
                  {t("nav.gallery")}
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/my-gallery" />}>
                  {t("nav.myGenerations")}
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
          {user && (
            <Link href="/settings" onClick={() => setMobileOpen(false)} className="block py-2 text-sm hover:text-foreground/80">
              {t("nav.settings")}
            </Link>
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
