import type { Viewport } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_Bengali } from "next/font/google";

/* Shared by both root layouts: (public) and (app). */

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Variable fonts: one file covers every weight, instead of one per weight.
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

// Not preloaded: English pages never use it, and its unicode-range makes
// the browser fetch it only when Bengali text is on screen.
export const notoBengali = Noto_Sans_Bengali({
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

export const fontVariables = `${inter.variable} ${jetbrainsMono.variable} ${notoBengali.variable}`;
