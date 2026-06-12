import type { Metadata } from "next";
import "./globals.css";

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
    description:
      "Simplify meal tracking, expenses & accounting for your mess.",
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
