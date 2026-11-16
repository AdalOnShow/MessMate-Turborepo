"use client";

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
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="font-body antialiased">
        <ErrorScreen
          fullScreen
          icon={AlertOctagon}
          title="MessMate couldn't load"
          description="A critical error stopped the app from loading. Please try again in a moment."
          reference={error.digest}
          onRetry={reset}
          homeHref="/"
          homeLabel="Reload home"
        />
      </body>
    </html>
  );
}
