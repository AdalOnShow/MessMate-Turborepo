"use client";

import { useEffect, useState } from "react";
import { AlertOctagon } from "lucide-react";
import "./globals.css";

/**
 * Last-resort boundary for errors in the root layout itself. It replaces the
 * root layout, so no intl provider exists here: `useTranslations` (also used
 * inside `ErrorScreen`) would throw and crash this page too. Keep it
 * self-contained with a tiny built-in string table.
 */
const TEXT = {
  en: {
    title: "MessMate couldn't open",
    description: "Something broke. Please try again in a minute.",
    retry: "Try again",
    home: "Go to home",
    ref: "Ref:",
  },
  bn: {
    title: "মেসমেট খোলা যায়নি",
    description: "একটা সমস্যা হয়েছে। এক মিনিট পর আবার চেষ্টা করুন।",
    retry: "আবার চেষ্টা করুন",
    home: "হোমে যান",
    ref: "রেফ:",
  },
} as const;

type Locale = keyof typeof TEXT;

function readLocale(): Locale {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  return match?.[1] === "bn" ? "bn" : "en";
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale] = useState<Locale>(readLocale);
  const text = TEXT[locale];

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={locale}>
      <body className="font-body antialiased bg-background text-foreground">
        <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertOctagon size={28} aria-hidden />
          </span>
          <h1 className="text-xl font-bold">{text.title}</h1>
          <p className="max-w-sm text-foreground-muted">{text.description}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="min-h-11 rounded-xl bg-primary px-5 font-semibold text-white transition-transform active:scale-95"
            >
              {text.retry}
            </button>
            {/* Full reload on purpose: the app shell itself failed. */}
            <button
              type="button"
              onClick={() => window.location.assign("/")}
              className="flex min-h-11 items-center rounded-xl border border-border px-5 font-semibold transition-transform active:scale-95"
            >
              {text.home}
            </button>
          </div>
          {error.digest && (
            <p className="font-mono text-xs text-foreground-muted">
              {text.ref} {error.digest.slice(0, 8)}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
