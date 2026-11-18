"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from "@/i18n/config";
import { setLocale as saveLocaleCookie } from "../../actions/locale";
import { AppSplash } from "../feedback/AppSplash";

/*
 * Language for the dashboard, chosen in the browser.
 *
 * The dashboard's root layout must not read cookies on the server: that
 * would make every dashboard page dynamic, and each navigation would wait
 * for a server render. So the pages are prerendered once, and the language
 * is picked here from the NEXT_LOCALE cookie (not httpOnly), loading only
 * that language's messages.
 */

// One chunk per language, so only the chosen one is downloaded.
// (The guide's step lists are arrays, which next-intl's message type doesn't
// describe, hence the cast.)
const LOADERS: Record<Locale, () => Promise<AbstractIntlMessages>> = {
  en: () =>
    import("@/messages/en").then(
      (m) => m.default as unknown as AbstractIntlMessages,
    ),
  bn: () =>
    import("@/messages/bn").then(
      (m) => m.default as unknown as AbstractIntlMessages,
    ),
};

function readLocaleCookie(): Locale {
  const match = new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`).exec(
    document.cookie,
  );
  const value = match?.[1] ? decodeURIComponent(match[1]) : undefined;
  return isLocale(value) ? value : defaultLocale;
}

interface LocaleSwitch {
  locale: Locale;
  /** Switches the language in place (no reload) and saves the choice. */
  setLocale: (next: Locale) => Promise<void>;
}

const LocaleSwitchContext = createContext<LocaleSwitch | null>(null);

/** Present only inside the dashboard; public pages switch via the server. */
export function useClientLocaleSwitch() {
  return useContext(LocaleSwitchContext);
}

const timeZone =
  typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "Asia/Dhaka";

export function ClientIntlProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<{
    locale: Locale;
    messages: AbstractIntlMessages;
  } | null>(null);

  // Load the saved language once on mount.
  useEffect(() => {
    let alive = true;
    const locale = readLocaleCookie();
    LOADERS[locale]().then((messages) => {
      if (alive) setState({ locale, messages });
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (state) document.documentElement.lang = state.locale;
  }, [state]);

  const setLocale = useCallback(async (next: Locale) => {
    const [messages] = await Promise.all([
      LOADERS[next](),
      // Keeps the cookie in sync, so public pages use the same language.
      saveLocaleCookie(next),
    ]);
    setState({ locale: next, messages });
  }, []);

  const switcher = useMemo(
    () => (state ? { locale: state.locale, setLocale } : null),
    [state, setLocale],
  );

  // Never show text in the wrong language: wait for the messages.
  if (!state || !switcher) return <AppSplash />;

  return (
    <LocaleSwitchContext.Provider value={switcher}>
      <NextIntlClientProvider
        locale={state.locale}
        messages={state.messages}
        timeZone={timeZone}
      >
        {children}
      </NextIntlClientProvider>
    </LocaleSwitchContext.Provider>
  );
}
