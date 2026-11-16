"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { ErrorScreen } from "./components/feedback/ErrorScreen";

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
    <ErrorScreen
      fullScreen
      icon={AlertTriangle}
      title={t("somethingWentWrong")}
      description={t("unexpectedErrorOccurredWhile")}
      reference={error.digest}
      onRetry={reset}
      homeHref="/"
      homeLabel={t("goHome")}
    />
  );
}
