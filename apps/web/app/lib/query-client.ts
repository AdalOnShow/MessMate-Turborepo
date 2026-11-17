import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ErrorCode } from "@repo/shared";
import { toast } from "../store/toast";
import { ActionError, toActionError } from "./action-result";
import { errorText } from "./error-text";
import { successText, type SuccessMessageKey } from "./success-text";

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ActionError;
    mutationMeta: {
      /** Toast shown when the mutation succeeds. */
      successMessage?: SuccessMessageKey;
      /** Set false when the UI already shows the error (e.g. auth forms). */
      errorToast?: boolean;
    };
    queryMeta: {
      /** Set false to stop background-refetch failures from toasting. */
      errorToast?: boolean;
      /**
       * The query's own mutations keep its cache up to date, so the global
       * "invalidate everything after a write" skips it.
       */
      manualCacheUpdate?: boolean;
    };
  }
}

const MAX_RETRIES = 2;

let redirectingToSignin = false;

/**
 * The API rejected our session and the refresh token could not renew it.
 * Clear the cookies (so the route proxy does not bounce us back) and send
 * the user to sign in, once.
 */
async function handleSessionExpired() {
  if (redirectingToSignin || typeof window === "undefined") return;
  redirectingToSignin = true;
  toast.error(errorText("sessionExpired", "Your session has expired"), {
    description: errorText("sessionExpiredHint", "Please sign in again."),
  });
  try {
    const { clearOfflineData } = await import("./offline-cache");
    clearOfflineData();
    const { logout } = await import("../actions/auth");
    await logout();
  } finally {
    window.location.assign("/signin");
  }
}

function reportError(error: unknown, retry?: () => void) {
  const err = toActionError(error);
  if (err.code === ErrorCode.SESSION_EXPIRED) {
    void handleSessionExpired();
    return;
  }
  const fallbackTitle = errorText("somethingWrong", "Something went wrong");
  toast.error(err.isServerError ? fallbackTitle : err.message, {
    description: err.isServerError ? err.message : undefined,
    reference: err.isServerError ? err.requestId : undefined,
    // Network blips and server hiccups often succeed on a second try.
    action:
      retry && err.isRetryable
        ? { label: errorText("tryAgain", "Try again"), onClick: retry }
        : undefined,
  });
}

function makeQueryClient() {
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        const err = toActionError(error);
        if (err.code === ErrorCode.SESSION_EXPIRED) {
          void handleSessionExpired();
          return;
        }
        // First-load failures are rendered in place by <QueryErrorState>.
        // Only toast when a background refetch fails and stale data stays
        // on screen, so the user knows it may be out of date.
        if (query.state.data === undefined) return;
        if (query.meta?.errorToast === false) return;
        toast.error(errorText("couldntRefresh", "Couldn't refresh data"), {
          description: err.message,
        });
      },
    }),
    // Almost every screen derives from the same month data (meals, expenses,
    // deposits, balances), so after any successful write mark everything
    // stale. Mounted queries refetch immediately; the rest refetch on next
    // use. This keeps lists and dashboard figures from going out of date.
    mutationCache: new MutationCache({
      onSuccess: (_data, _vars, _ctx, mutation) => {
        const message = mutation.meta?.successMessage;
        if (message) toast.success(successText(message));
        // Refetching a "Load more" list re-requests every page it has
        // loaded. Lists that are not on screen are dropped instead, so they
        // load just their first page when opened again.
        for (const query of client.getQueryCache().getAll()) {
          if (query.meta?.manualCacheUpdate) continue;
          const data = query.state.data as { pages?: unknown } | undefined;
          if (Array.isArray(data?.pages) && query.getObserversCount() === 0) {
            client.removeQueries({ queryKey: query.queryKey, exact: true });
          }
        }
        void client.invalidateQueries({
          predicate: (query) => !query.meta?.manualCacheUpdate,
        });
      },
      onError: (error, variables, _ctx, mutation) => {
        if (mutation.meta?.errorToast === false) {
          // Still handle an expired session globally.
          if (toActionError(error).code === ErrorCode.SESSION_EXPIRED) {
            void handleSessionExpired();
          }
          return;
        }
        reportError(error, () => {
          // Re-run the same request; the cache handlers toast the outcome.
          mutation.execute(variables).catch(() => {});
        });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
        // Retry only transient failures; a 403/404/validation error will
        // not fix itself and retrying just delays the error state.
        retry: (failureCount, error) =>
          failureCount < MAX_RETRIES && toActionError(error).isRetryable,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
      mutations: {
        // Writes are not idempotent; never retry them automatically.
        retry: false,
      },
    },
  });
  return client;
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
