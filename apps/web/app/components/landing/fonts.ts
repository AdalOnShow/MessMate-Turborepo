import { Schibsted_Grotesk } from "next/font/google";

/* Landing-only typeface. Imported only by the landing page, so the dashboard
   and the other public pages keep Inter and never download this file.
   Bangla falls through to Noto Sans Bengali (see `.landing` in globals.css). */
export const landingFont = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-landing",
  display: "swap",
});
