"use client";

import { useTranslations } from "next-intl";
import { setErrorTranslator } from "@/app/lib/error-text";

/** Lets non-React code (query client, `unwrap`) show translated errors. */
export function ErrorTranslatorBridge() {
  const t = useTranslations("feedback.errors");
  // Set during render so the translator is ready before any child query or
  // mutation can fail; it is a module-level ref, not React state.
  setErrorTranslator(t as unknown as Parameters<typeof setErrorTranslator>[0]);
  return null;
}
