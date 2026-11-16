"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { setLocale } from "../actions/locale";
import { locales, type Locale } from "@/i18n/config";
import { cn } from "../lib/utils";

const LABELS: Record<Locale, string> = { en: "EN", bn: "বাং" };

/** Segmented EN | বাং switch. Persists the choice in a cookie and re-renders server components. */
export function LanguageToggle({ className }: { className?: string }) {
  const t = useTranslations("common");
  const current = useLocale() as Locale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const choose = (next: Locale) => {
    if (next === current || pending) return;
    startTransition(async () => {
      const result = await setLocale(next);
      if (result.ok) router.refresh();
    });
  };

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn(
        "inline-flex h-8 shrink-0 items-center rounded-[8px] border border-border bg-surface-raised p-0.5",
        pending && "opacity-70",
        className,
      )}
    >
      {locales.map((locale) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-pressed={active}
            disabled={pending}
            onClick={() => choose(locale)}
            className={cn(
              "h-full min-w-9 rounded-[6px] px-2 text-[11px] font-semibold transition-colors",
              locale === "en" ? "font-mono tracking-wider" : "font-bengali",
              active
                ? "bg-primary/15 text-primary"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            {LABELS[locale]}
          </button>
        );
      })}
    </div>
  );
}
