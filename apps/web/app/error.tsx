"use client";

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
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorScreen
      fullScreen
      icon={AlertTriangle}
      title="Something went wrong"
      description="An unexpected error occurred while loading this page. Please try again. If it keeps happening, let us know with the reference below."
      reference={error.digest}
      onRetry={reset}
      homeHref="/"
      homeLabel="Go home"
    />
  );
}
