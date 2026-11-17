import { validationMessageKey } from "@repo/shared";
/**
 * Translated error text for code that runs outside React (query client,
 * `unwrap`). `ErrorTranslatorBridge` registers the current locale's
 * `feedback.errors` translator; until then (or on the server) the English
 * fallback passed by the caller is used.
 */
type Translator = {
  (key: string, values?: Record<string, string | number>): string;
  has: (key: string) => boolean;
};

let translator: Translator | null = null;

export function setErrorTranslator(t: Translator | null) {
  translator = t;
}

export function errorText(
  key: string,
  fallback: string,
  values?: Record<string, string | number>,
): string {
  if (!translator || !translator.has(key)) return fallback;
  return translator(key, values);
}

/** Translated text for an API `ErrorCode`, or null if none is defined. */
export function errorCodeText(code: string | undefined): string | null {
  if (!code || !translator) return null;
  const key = `codes.${code}`;
  return translator.has(key) ? translator(key) : null;
}

/**
 * A validation message from the shared Zod schemas (client-side or in an
 * API `details` map), in the user's language. Messages that are not in
 * `ValidationMessage` (e.g. Zod's own defaults) are returned unchanged.
 */
export function validationText(message: string): string {
  const key = validationMessageKey(message);
  return key ? errorText(`validation.${key}`, message) : message;
}

/** `validationText` applied to every message of a `{ field: message }` map. */
export function translateFieldErrors(
  errors: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [field, message] of Object.entries(errors)) {
    out[field] = validationText(message);
  }
  return out;
}
