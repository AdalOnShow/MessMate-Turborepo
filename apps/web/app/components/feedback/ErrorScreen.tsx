import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface ErrorScreenProps {
  icon: LucideIcon;
  code?: string;
  title: string;
  description: string;
  /** Error digest / request id for support. */
  reference?: string;
  onRetry?: () => void;
  homeHref?: string;
  homeLabel?: string;
  fullScreen?: boolean;
}

/** Shared layout for error boundaries and the 404 page. */
export function ErrorScreen({
  icon: Icon,
  code,
  title,
  description,
  reference,
  onRetry,
  homeHref = "/dashboard",
  homeLabel = "Go to dashboard",
  fullScreen,
}: ErrorScreenProps) {
  return (
    <div
      className={
        fullScreen
          ? "flex min-h-screen items-center justify-center bg-background px-4"
          : "flex min-h-[60vh] items-center justify-center px-4"
      }
    >
      <div className="animate-fade-in w-full max-w-md text-center">
        <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface-raised text-primary">
          <Icon size={28} aria-hidden />
        </span>
        {code && (
          <p className="mb-2 font-mono text-sm font-semibold tracking-widest text-primary">
            {code}
          </p>
        )}
        <h1 className="heading-tight text-2xl text-foreground">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
          {description}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover sm:w-auto"
            >
              Try again
            </button>
          )}
          <Link
            href={homeHref}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border-strong px-5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-raised sm:w-auto"
          >
            {homeLabel}
          </Link>
        </div>

        {reference && (
          <p className="mt-8 font-mono text-[11px] text-foreground-muted/70">
            Reference: {reference}
          </p>
        )}
      </div>
    </div>
  );
}
