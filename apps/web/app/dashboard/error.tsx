"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { ErrorScreen } from "../components/feedback/ErrorScreen";

/**
 * Catches render errors inside dashboard pages. Rendered inside the
 * dashboard layout, so the sidebar and bottom nav stay usable.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("misc.dashboard");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorScreen
      icon={AlertTriangle}
      title={t("pageRanIntoProblem")}
      description={t("somethingUnexpectedHappenedWhile")}
      reference={error.digest}
      onRetry={reset}
    />
  );
}
