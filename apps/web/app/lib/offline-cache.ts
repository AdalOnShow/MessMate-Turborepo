import { dehydrate, hydrate, type QueryClient } from "@tanstack/react-query";
import type { ProfileUser } from "../actions/auth";

/**
 * Keeps the signed-in user and their last loaded data on the device, so the
 * installed app opens straight to the last-known screen and refreshes in
 * the background instead of showing a spinner on every launch.
 *
 * Data is stored per user and wiped on logout or session expiry. Every
 * access is wrapped: storage can be unavailable (private mode, full disk).
 */

const VERSION = "v1";
const USER_KEY = `messmate:user:${VERSION}`;
// Bump CACHE_VERSION whenever an API response shape changes, so data saved
// in the old shape is dropped instead of restored into the new code.
// v2: bazaar history became cursor-paginated pages.
const CACHE_VERSION = "v2";
const OLD_CACHE_VERSIONS = ["v1"];
const cacheKey = (userId: string, version = CACHE_VERSION) =>
  `messmate:cache:${version}:${userId}`;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const SAVE_DELAY_MS = 1000;

export function loadCachedUser(): ProfileUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as ProfileUser) : null;
  } catch {
    return null;
  }
}

export function saveCachedUser(user: ProfileUser) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

/** Loads the saved queries for this user into the client. */
export function restoreQueries(client: QueryClient, userId: string) {
  try {
    for (const version of OLD_CACHE_VERSIONS) {
      localStorage.removeItem(cacheKey(userId, version));
    }
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return;
    const saved = JSON.parse(raw) as { savedAt: number; state: unknown };
    if (Date.now() - saved.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(cacheKey(userId));
      return;
    }
    hydrate(client, saved.state as Parameters<typeof hydrate>[1]);
  } catch {
    // A corrupt entry is just dropped.
    try {
      localStorage.removeItem(cacheKey(userId));
    } catch {
      // ignore
    }
  }
}

/** Saves successful queries (debounced) until the returned stop() is called. */
export function persistQueries(client: QueryClient, userId: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const save = () => {
    timer = undefined;
    try {
      const state = dehydrate(client, {
        shouldDehydrateQuery: (q) => q.state.status === "success",
      });
      localStorage.setItem(
        cacheKey(userId),
        JSON.stringify({ savedAt: Date.now(), state }),
      );
    } catch {
      // Quota or serialisation failure: the app still works without it.
    }
  };

  const unsubscribe = client.getQueryCache().subscribe((event) => {
    if (event.type !== "updated" && event.type !== "removed") return;
    if (!timer) timer = setTimeout(save, SAVE_DELAY_MS);
  });

  return () => {
    unsubscribe();
    if (timer) clearTimeout(timer);
  };
}

/** Removes everything this module stored (logout, expired session). */
export function clearOfflineData() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (
        key?.startsWith("messmate:user:") ||
        key?.startsWith("messmate:cache:")
      ) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }
}
