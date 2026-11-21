"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { ErrorScreen } from "../components/feedback/ErrorScreen";
import { Spotlight } from "../components/landing/Spotlight";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("misc.error");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="landing-dark landing relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-background text-foreground">
      <Spotlight size="page" />
      <ErrorScreen
        icon={AlertTriangle}
        title={t("somethingWentWrong")}
        description={t("unexpectedErrorOccurredWhile")}
        reference={error.digest}
        onRetry={reset}
        homeHref="/"
        homeLabel={t("goHome")}
      />
    </div>
  );
}
