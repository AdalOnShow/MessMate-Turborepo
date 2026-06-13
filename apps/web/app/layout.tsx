import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Alkatra } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const alkatra = Alkatra({
  subsets: ["bengali"],
  weight: ["400", "500", "600"],
  variable: "--font-bengali",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MessMate — মেস ম্যানেজমেন্ট সহজ করুন | Smart Mess Management",
  description:
    "MessMate simplifies meal tracking, expense management, deposits, and monthly accounting for shared living. Built for students and bachelor messes in Bangladesh.",
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
      className={`${plusJakartaSans.variable} ${alkatra.variable}`}
    >
      <body className="font-body antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
