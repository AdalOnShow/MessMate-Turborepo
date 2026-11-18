import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { fontVariables, viewport as sharedViewport } from "../fonts";
import { ErrorTranslatorBridge } from "../components/feedback/ErrorTranslatorBridge";
import { ClientIntlProvider } from "../components/i18n/ClientIntlProvider";
import { Providers } from "../providers";
import "../globals.css";

/*
 * Root layout of the signed-in app (/dashboard/...).
 *
 * It must not read cookies or headers (no `next-intl/server` either): that
 * would make every dashboard page dynamic again, so each navigation would
 * wait for a server render. The pages are prerendered once and served as
 * static files; the language is chosen in the browser by ClientIntlProvider.
 * Public pages have their own root layout in app/(public)/layout.tsx.
 */

export const viewport = sharedViewport;

export const metadata: Metadata = {
  title: { default: "MessMate", template: "%s | MessMate" },
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
  robots: { index: false, follow: false },
};

export default function AppRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={fontVariables}>
      <body className="font-body antialiased">
        <ClientIntlProvider>
          <ErrorTranslatorBridge />
          <Providers>{children}</Providers>
        </ClientIntlProvider>
        <Analytics />
      </body>
    </html>
  );
}
