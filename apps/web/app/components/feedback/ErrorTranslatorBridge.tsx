"use client";

import { useTranslations } from "next-intl";
import { setErrorTranslator } from "@/app/lib/error-text";
import { setSuccessTranslator } from "@/app/lib/success-text";

/**
 * Lets non-React code (query client, `unwrap`) show translated error and
 * success messages.
 */
export function ErrorTranslatorBridge() {
  const t = useTranslations("feedback.errors");
  const tSuccess = useTranslations("feedback.success");
  // Set during render so the translator is ready before any child query or
  // mutation can fail; it is a module-level ref, not React state.
  setErrorTranslator(t as unknown as Parameters<typeof setErrorTranslator>[0]);
  setSuccessTranslator(
    tSuccess as unknown as Parameters<typeof setSuccessTranslator>[0],
  );
  return null;
}
