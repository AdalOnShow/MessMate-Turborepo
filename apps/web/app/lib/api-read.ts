import { ErrorCode } from "@repo/shared";
import {
  NETWORK_MESSAGE,
  TIMEOUT_MESSAGE,
  type ActionResult,
} from "./action-result";

const TIMEOUT_MS = 20_000;

/**
 * Browser-side GET through `/api/...` (see app/api/[...path]/route.ts).
 * Returns the same `ActionResult` a server action would, so hooks keep
 * using `unwrap(...)` and the global error handling is unchanged.
 */
export async function apiGet<T>(path: string): Promise<ActionResult<T>> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut =
      err instanceof DOMException &&
      (err.name === "TimeoutError" || err.name === "AbortError");
    return {
      ok: false,
      status: 0,
      code: timedOut ? ErrorCode.TIMEOUT : ErrorCode.NETWORK_ERROR,
      message: timedOut ? TIMEOUT_MESSAGE : NETWORK_MESSAGE,
    };
  }

  try {
    return (await res.json()) as ActionResult<T>;
  } catch {
    return {
      ok: false,
      status: res.status || 502,
      code: ErrorCode.SERVICE_UNAVAILABLE,
      message: "The server returned an unreadable response.",
    };
  }
}
