import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ErrorCode } from "@repo/shared";
import { toast } from "../store/toast";
import { ActionError, toActionError } from "./action-result";

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ActionError;
    mutationMeta: {
      /** Toast shown when the mutation succeeds. */
      successMessage?: string;
      /** Set false when the UI already shows the error (e.g. auth forms). */
      errorToast?: boolean;
    };
    queryMeta: {
      /** Set false to stop background-refetch failures from toasting. */
      errorToast?: boolean;
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
  toast.error("Your session has expired", {
    description: "Please sign in again to continue.",
  });
  try {
    const { logout } = await import("../actions/auth");
    await logout();
  } finally {
    window.location.assign("/signin");
  }
}

function reportError(error: unknown, fallbackTitle: string) {
  const err = toActionError(error);
  if (err.code === ErrorCode.SESSION_EXPIRED) {
    void handleSessionExpired();
    return;
  }
  toast.error(err.isServerError ? fallbackTitle : err.message, {
    description: err.isServerError ? err.message : undefined,
    reference: err.isServerError ? err.requestId : undefined,
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
        toast.error("Couldn't refresh data", {
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
        if (message) toast.success(message);
        void client.invalidateQueries();
      },
      onError: (error, _vars, _ctx, mutation) => {
        if (mutation.meta?.errorToast === false) {
          // Still handle an expired session globally.
          if (toActionError(error).code === ErrorCode.SESSION_EXPIRED) {
            void handleSessionExpired();
          }
          return;
        }
        reportError(error, "Something went wrong");
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
