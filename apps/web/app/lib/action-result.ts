import { ErrorCode } from "@repo/shared";
import { errorCodeText, errorText } from "./error-text";

/**
 * Server actions must not throw for expected API failures: in production
 * Next.js replaces the message of any error thrown on the server with a
 * generic "An error occurred in the Server Components render" string, so the
 * user never sees why a request failed. Actions return an `ActionResult`
 * instead, and client code calls `unwrap()` to turn a failure back into a
 * thrown error that carries the real message.
 */
export type ActionFailure = {
  ok: false;
  status: number;
  message: string;
  code?: ErrorCode;
  requestId?: string;
  details?: unknown;
};

export type ActionResult<T> = { ok: true; data: T } | ActionFailure;

export class ActionError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
    public code?: ErrorCode,
    public requestId?: string,
  ) {
    super(message);
    this.name = "ActionError";
  }

  /** Server-side fault: the user did nothing wrong. */
  get isServerError() {
    return this.status >= 500;
  }

  /** Could not reach the server at all (offline, timeout, DNS, ...). */
  get isNetworkError() {
    return (
      this.status === 0 ||
      this.code === ErrorCode.NETWORK_ERROR ||
      this.code === ErrorCode.TIMEOUT
    );
  }

  /** Worth retrying automatically: transient, not the user's input. */
  get isRetryable() {
    return (
      this.isNetworkError ||
      this.status === 429 ||
      this.status === 502 ||
      this.status === 503 ||
      this.status === 504
    );
  }
}

export const NETWORK_MESSAGE =
  "Can't reach MessMate right now. Check your connection and try again.";
export const TIMEOUT_MESSAGE =
  "The server is taking too long to respond. Please try again.";
const SERVER_MESSAGE = "Something went wrong on our side. Please try again.";
const UNAVAILABLE_MESSAGE =
  "MessMate is temporarily unavailable. Please try again in a moment.";

function firstDetail(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  for (const value of Object.values(details as Record<string, unknown>)) {
    if (typeof value === "string" && value) return value;
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  }
  return null;
}

/** Human-readable message for a failed result, in the user's language. */
export function failureMessage(result: {
  status: number;
  message: string;
  code?: ErrorCode;
  details?: unknown;
}): string {
  if (result.code === ErrorCode.TIMEOUT) {
    return errorText("timeout", TIMEOUT_MESSAGE);
  }
  if (result.status === 0) return errorText("network", NETWORK_MESSAGE);
  if (result.status === 429) {
    return errorText(
      "rateLimited",
      "Too many requests. Please wait a moment and try again.",
    );
  }
  if (result.status === 502 || result.status === 503 || result.status === 504) {
    return errorText("unavailable", UNAVAILABLE_MESSAGE);
  }
  if (result.status >= 500) return errorText("server", SERVER_MESSAGE);
  // Field problems are shown next to the field when the form supports it;
  // otherwise the first field message is more useful than a generic one.
  const isValidation =
    result.code === ErrorCode.VALIDATION_FAILED ||
    result.code === ErrorCode.BAD_REQUEST;
  const detail = firstDetail(result.details);
  if (isValidation && detail) return detail;
  return errorCodeText(result.code) ?? detail ?? result.message;
}

/** Normalize anything thrown into an `ActionError`. */
export function toActionError(error: unknown): ActionError {
  if (error instanceof ActionError) return error;
  // A server action that could not be delivered (offline, server down) or
  // crashed on the server rejects with a plain Error.
  const offline =
    typeof navigator !== "undefined" && navigator.onLine === false;
  if (offline || error instanceof TypeError) {
    return new ActionError(
      0,
      errorText("network", NETWORK_MESSAGE),
      undefined,
      ErrorCode.NETWORK_ERROR,
    );
  }
  return new ActionError(
    500,
    errorText("server", SERVER_MESSAGE),
    undefined,
    ErrorCode.INTERNAL_ERROR,
  );
}

/** Resolve to the data of a successful action, or throw an `ActionError`. */
export async function unwrap<T>(
  pending: Promise<ActionResult<T>> | ActionResult<T>,
): Promise<T> {
  let result: ActionResult<T>;
  try {
    result = await pending;
  } catch (error) {
    throw toActionError(error);
  }
  if (result.ok) return result.data;
  throw new ActionError(
    result.status,
    failureMessage(result),
    result.details,
    result.code,
    result.requestId,
  );
}
