"use client";

import { AlertTriangle, Lock, RefreshCw, SearchX, WifiOff } from "lucide-react";
import { toActionError } from "@/app/lib/action-result";
import { cn } from "@/app/lib/utils";

interface QueryErrorStateProps {
  error: unknown;
  /** Usually `query.refetch`. Hidden when retrying cannot help (403/404). */
  onRetry?: () => unknown;
  isRetrying?: boolean;
  /** What failed to load, e.g. "deposits". */
  resource?: string;
  /** Compact variant for use inside a card. */
  compact?: boolean;
  className?: string;
}

/**
 * In-place error for a failed data load. Use instead of rendering an empty
 * list, so "nothing here" and "couldn't load" never look the same.
 */
export function QueryErrorState({
  error,
  onRetry,
  isRetrying,
  resource,
  compact,
  className,
}: QueryErrorStateProps) {
  const err = toActionError(error);

  const kind = err.isNetworkError
    ? "network"
    : err.status === 403
      ? "forbidden"
      : err.status === 404
        ? "notFound"
        : "generic";

  const Icon = {
    network: WifiOff,
    forbidden: Lock,
    notFound: SearchX,
    generic: AlertTriangle,
  }[kind];

  const title = {
    network: "You're offline or the server is unreachable",
    forbidden: "You don't have access to this",
    notFound: "Not found",
    generic: resource ? `Couldn't load ${resource}` : "Couldn't load this",
  }[kind];

  const canRetry = onRetry && kind !== "forbidden" && kind !== "notFound";

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 text-center",
        compact ? "gap-2 px-4 py-6" : "gap-3 px-6 py-12",
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-destructive/10 text-destructive",
          compact ? "h-9 w-9" : "h-12 w-12",
        )}
      >
        <Icon size={compact ? 18 : 22} aria-hidden />
      </span>
      <div className="max-w-sm space-y-1">
        <p
          className={cn(
            "font-semibold text-foreground",
            compact ? "text-sm" : "text-base",
          )}
        >
          {title}
        </p>
        <p className="text-sm text-foreground-muted">{err.message}</p>
        {err.isServerError && err.requestId && (
          <p className="font-mono text-[11px] text-foreground-muted/70">
            Ref: {err.requestId.slice(0, 8)}
          </p>
        )}
      </div>
      {canRetry && (
        <button
          type="button"
          onClick={() => void onRetry()}
          disabled={isRetrying}
          className="mt-1 inline-flex h-9 items-center gap-2 rounded-lg border border-border-strong px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-raised disabled:opacity-60"
        >
          <RefreshCw
            size={14}
            className={cn(isRetrying && "animate-spin")}
            aria-hidden
          />
          {isRetrying ? "Retrying..." : "Try again"}
        </button>
      )}
    </div>
  );
}

type QueryLike = {
  isError: boolean;
  error: unknown;
  data: unknown;
  isFetching: boolean;
  refetch: () => unknown;
};

/**
 * Queries that failed with nothing to show. A query whose background
 * refetch failed still has data, so it keeps rendering (a toast covers it).
 */
export function failedQueries(...queries: QueryLike[]): QueryLike[] {
  return queries.filter((q) => q.isError && q.data === undefined);
}

/** Error state for a group of queries; retries every failed one. */
export function QueriesErrorState({
  queries,
  ...rest
}: { queries: QueryLike[] } & Omit<
  QueryErrorStateProps,
  "error" | "onRetry" | "isRetrying"
>) {
  const failed = failedQueries(...queries);
  const first = failed[0];
  if (!first) return null;
  return (
    <QueryErrorState
      {...rest}
      error={first.error}
      isRetrying={failed.some((q) => q.isFetching)}
      onRetry={() => failed.forEach((q) => void q.refetch())}
    />
  );
}
