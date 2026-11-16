/**
 * Server actions must not throw for expected API failures: in production
 * Next.js replaces the message of any error thrown on the server with a
 * generic "An error occurred in the Server Components render" string, so the
 * user never sees why a request failed. Actions return an `ActionResult`
 * instead, and client code calls `unwrap()` to turn a failure back into a
 * thrown error that carries the real message.
 */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string; details?: unknown };

export class ActionError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ActionError";
  }
}

function firstDetail(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  for (const value of Object.values(details as Record<string, unknown>)) {
    if (typeof value === "string" && value) return value;
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  }
  return null;
}

/** Human-readable message for a failed result. */
export function failureMessage(result: {
  status: number;
  message: string;
  details?: unknown;
}): string {
  if (result.status === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }
  // "Validation failed" alone is useless; prefer the first field message.
  return firstDetail(result.details) ?? result.message;
}

/** Resolve to the data of a successful action, or throw an `ActionError`. */
export async function unwrap<T>(
  pending: Promise<ActionResult<T>> | ActionResult<T>,
): Promise<T> {
  const result = await pending;
  if (result.ok) return result.data;
  throw new ActionError(result.status, failureMessage(result), result.details);
}
