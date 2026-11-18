import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { fontVariables } from "./fonts";
import NotFound from "./(public)/not-found";
import "./globals.css";

/*
 * 404 for URLs that match no route. The app has two root layouts, (public)
 * and (app), so there is no single layout to build it from; this page
 * brings its own html, styles, fonts and messages. Reading the language
 * cookie here is fine: it only runs for unknown URLs.
 */

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("misc.notFound");
  return { title: t("pageNotFoundMessmate") };
}

export default async function GlobalNotFound() {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} className={fontVariables}>
      <body className="font-body antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <NotFound />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
