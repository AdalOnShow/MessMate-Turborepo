import { useCallback, useState } from "react";
import { ErrorCode } from "@repo/shared";
import { toActionError } from "./action-result";

export type FieldErrors = Record<string, string>;

/**
 * Field messages from an API validation failure (`details` is the
 * `formatZodError` map: `{ field: message }`), or `{}` for any other error.
 */
export function fieldErrorsFrom(error: unknown): FieldErrors {
  const err = toActionError(error);
  const isValidation =
    err.code === ErrorCode.VALIDATION_FAILED ||
    err.code === ErrorCode.BAD_REQUEST;
  if (!isValidation || !err.details || typeof err.details !== "object") {
    return {};
  }
  const out: FieldErrors = {};
  for (const [key, value] of Object.entries(
    err.details as Record<string, unknown>,
  )) {
    if (typeof value === "string" && value) out[key] = value;
    else if (Array.isArray(value) && typeof value[0] === "string") {
      out[key] = value[0];
    }
  }
  return out;
}

/** Scroll to and focus the first field marked invalid in the form. */
export function focusFirstInvalid() {
  if (typeof document === "undefined") return;
  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus({ preventScroll: true });
  });
}

/**
 * Per-field error state for a form.
 * - `set(errors)` shows messages (and focuses the first one),
 * - `clear(field)` removes one as the user edits it,
 * - `fromServer(error)` maps an API validation error onto fields and returns
 *   true when it did, so the caller can skip the toast.
 */
export function useFieldErrors() {
  const [errors, setErrors] = useState<FieldErrors>({});

  const set = useCallback((next: FieldErrors) => {
    setErrors(next);
    if (Object.keys(next).length > 0) focusFirstInvalid();
  }, []);

  const clear = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const rest = { ...prev };
      delete rest[field];
      return rest;
    });
  }, []);

  const reset = useCallback(() => setErrors({}), []);

  const fromServer = useCallback(
    (error: unknown) => {
      const mapped = fieldErrorsFrom(error);
      if (Object.keys(mapped).length === 0) return false;
      set(mapped);
      return true;
    },
    [set],
  );

  return { errors, set, clear, reset, fromServer };
}
