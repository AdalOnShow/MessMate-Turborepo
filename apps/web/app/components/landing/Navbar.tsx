"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "../LanguageToggle";

const NAV_LINKS = [
  { key: "features", href: "/#features" },
  { key: "howItWorks", href: "/#how-it-works" },
  { key: "accounting", href: "/#accounting" },
  { key: "preview", href: "/#preview" },
  { key: "faq", href: "/#faq" },
  { key: "guide", href: "/guide" },
  { key: "install", href: "/install" },
] as const;

export function Navbar() {
  const t = useTranslations("landing.nav");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-border bg-background/90 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-[60px] max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/messmate-logo.png"
            alt={t("logoAlt")}
            width={860}
            height={600}
            priority
            className="h-8 w-auto"
          />
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="nav-link text-sm font-medium text-foreground-muted hover:text-foreground"
            >
              {t(link.key)}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageToggle />
          <a
            href="/signin"
            className="nav-link mx-3 text-[13px] font-semibold text-foreground-muted hover:text-foreground"
          >
            {tc("signIn")}
          </a>
          <a
            href="/signup"
            className="bg-cta rounded-[7px] px-[18px] py-2 text-[13px] font-bold"
          >
            {tc("getStarted")}
          </a>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageToggle />
          <button
            type="button"
            aria-label={tc("toggleMenu")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex size-10 items-center justify-center rounded-xl border border-border bg-surface-raised text-foreground lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border bg-background/95 px-4 pb-6 pt-4 backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground"
              >
                {t(link.key)}
              </a>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
            <a
              href="/signin"
              onClick={() => setOpen(false)}
              className="rounded-[9px] border border-border-strong px-5 py-2.5 text-center text-sm font-semibold text-foreground"
            >
              {tc("signIn")}
            </a>
            <a
              href="/signup"
              onClick={() => setOpen(false)}
              className="bg-cta rounded-[9px] px-5 py-2.5 text-center text-sm font-bold"
            >
              {tc("getStarted")}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
