"use client";

import Image from "next/image";
import Link from "next/link";
import { LanguageToggle } from "../LanguageToggle";

/** Slim sticky header for small screens (the sidebar is hidden below `lg`). */
export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-xl lg:hidden">
      <Link href="/dashboard" className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-raised">
          <Image
            src="/messmate-icon.png"
            alt=""
            width={460}
            height={400}
            className="h-5 w-auto object-contain"
          />
        </span>
        <span className="text-base font-extrabold tracking-[-0.03em] text-foreground">
          Mess<span className="text-primary">Mate</span>
        </span>
      </Link>
      <LanguageToggle />
    </header>
  );
}
