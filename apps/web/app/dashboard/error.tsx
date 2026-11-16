"use client";

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
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorScreen
      icon={AlertTriangle}
      title="This page ran into a problem"
      description="Something unexpected happened while showing this page. Your data is safe. Try again, or head back to the dashboard."
      reference={error.digest}
      onRetry={reset}
    />
  );
}
