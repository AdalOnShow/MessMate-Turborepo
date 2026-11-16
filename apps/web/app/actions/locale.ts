"use server";

import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import type { ActionResult } from "../lib/action-result";

export async function setLocale(locale: string): Promise<ActionResult<Locale>> {
  if (!isLocale(locale)) {
    return { ok: false, status: 400, message: "Unsupported language" };
  }
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return { ok: true, data: locale };
}
