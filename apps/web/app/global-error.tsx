"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { AlertOctagon } from "lucide-react";
import "./globals.css";
import { ErrorScreen } from "./components/feedback/ErrorScreen";

/** Last-resort boundary for errors in the root layout itself. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("misc.globalError");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="font-body antialiased">
        <ErrorScreen
          fullScreen
          icon={AlertOctagon}
          title={t("messmateCouldnTLoad")}
          description={t("criticalErrorStoppedApp")}
          reference={error.digest}
          onRetry={reset}
          homeHref="/"
          homeLabel={t("reloadHome")}
        />
      </body>
    </html>
  );
}
