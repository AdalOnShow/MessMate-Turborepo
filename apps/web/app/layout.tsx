import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Alkatra } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

const alkatra = Alkatra({
  subsets: ["bengali"],
  weight: ["400", "500", "600"],
  variable: "--font-alkatra",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MessMate — মেস ম্যানেজমেন্ট সহজ করুন | Smart Mess Management",
  description:
    "MessMate simplifies meal tracking, expense management, deposits, and monthly accounting for shared living. Built for students and bachelor messes in Bangladesh.",
  icons: {
    icon: "/messmate-icon.png",
  },
  keywords: [
    "mess management",
    "meal tracking",
    "mess accounting",
    "shared living",
    "bachelor mess",
    "student mess",
    "Bangladesh",
    "expense tracker",
  ],
  openGraph: {
    title: "MessMate — Smart Mess Management",
    description: "Simplify meal tracking, expenses & accounting for your mess.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${alkatra.variable}`}
    >
      <body className="font-body antialiased">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
