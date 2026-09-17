"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Accounting", href: "/#accounting" },
  { label: "Preview", href: "/#preview" },
  { label: "FAQ", href: "/#faq" },
];

export function Navbar() {
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
          ? "border-b border-transparent bg-background/90 shadow-lg shadow-black/20 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/messmate-logo.png"
            alt="MessMate logo"
            width={860}
            height={600}
            priority
            className="h-9 w-auto"
          />
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="/signin"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:text-foreground"
          >
            Sign In
          </a>
          <a
            href="/signup"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-background shadow-[0_0_0_1px_rgba(6,182,212,0.4),0_0_24px_rgba(6,182,212,0.35)] transition-all hover:bg-primary-hover active:scale-[0.98]"
          >
            Get Started
          </a>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex size-10 items-center justify-center rounded-xl border border-foreground-muted/15 bg-surface-raised text-foreground lg:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-foreground-muted/10 bg-background/95 px-4 pb-6 pt-4 backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3 border-t border-foreground-muted/10 pt-4">
            <a
              href="/signin"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-foreground-muted/15 px-5 py-2.5 text-center text-sm font-semibold text-foreground"
            >
              Sign In
            </a>
            <a
              href="/signup"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-primary px-5 py-2.5 text-center text-sm font-bold text-background"
            >
              Get Started
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
