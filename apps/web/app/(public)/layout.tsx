import type { Metadata } from "next";
import { fontVariables, viewport as sharedViewport } from "../fonts";
import { landingFont } from "../components/landing/fonts";
import { NextIntlClientProvider } from "next-intl";
import { ErrorTranslatorBridge } from "../components/feedback/ErrorTranslatorBridge";
import { getLocale, getTranslations } from "next-intl/server";
import "../globals.css";
import { Providers } from "../providers";
import { Analytics } from "@vercel/analytics/next";

export const viewport = sharedViewport;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  const locale = await getLocale();
  return {
    title: t("title"),
    description: t("description"),
    applicationName: "MessMate",
    icons: {
      icon: "/messmate-icon.png",
      apple: "/icons/apple-touch-icon.png",
    },
    appleWebApp: {
      capable: true,
      title: "MessMate",
      statusBarStyle: "black-translucent",
    },
    formatDetection: { telephone: false },
    keywords: [
      "mess management",
      "meal tracking",
      "mess accounting",
      "shared living",
      "bachelor mess",
      "student mess",
      "Bangladesh",
      "expense tracker",
      "মেস ম্যানেজমেন্ট",
      "মিল হিসাব",
    ],
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      type: "website",
      locale: locale === "bn" ? "bn_BD" : "en_US",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${fontVariables} ${landingFont.variable}`}
    >
      <body className="font-body antialiased">
        <NextIntlClientProvider>
          <ErrorTranslatorBridge />
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
