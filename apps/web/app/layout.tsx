import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_Bengali } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { ErrorTranslatorBridge } from "./components/feedback/ErrorTranslatorBridge";
import { getLocale, getTranslations } from "next-intl/server";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Variable fonts: one file covers every weight, instead of one per weight.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

// Not preloaded: English pages never use it, and its unicode-range makes
// the browser fetch it only when Bengali text is on screen.
const notoBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  preload: false,
  variable: "--font-bangla",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#020013" },
    { media: "(prefers-color-scheme: light)", color: "#fcfcfd" },
  ],
};

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
      className={`${inter.variable} ${jetbrainsMono.variable} ${notoBengali.variable}`}
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
