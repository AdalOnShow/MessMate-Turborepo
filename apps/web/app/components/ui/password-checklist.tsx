"use client";

import { Check, Circle } from "lucide-react";
import { useTranslations } from "next-intl";
import { checkPassword, PASSWORD_RULES } from "@repo/shared";

/**
 * Live list of the password rules (8+ characters, A-Z, a-z, 0-9) that ticks
 * each one off as the person types, so they never have to guess why a
 * password was rejected. Rules come from `@repo/shared`, the same source the
 * API validates against.
 */
export function PasswordChecklist({
  id,
  password,
}: {
  id?: string;
  password: string;
}) {
  const t = useTranslations("feedback.passwordRules");
  const met = checkPassword(password);

  return (
    <div id={id} className="mt-2 text-xs">
      <p className="mb-1 text-foreground-muted">{t("title")}</p>
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => (
          <li
            key={rule}
            className={`flex items-center gap-1.5 transition-colors ${
              met[rule] ? "text-success" : "text-foreground-muted"
            }`}
          >
            {met[rule] ? (
              <Check size={13} className="shrink-0" aria-hidden />
            ) : (
              <Circle size={13} className="shrink-0" aria-hidden />
            )}
            <span>{t(rule)}</span>
            <span className="sr-only">
              ({met[rule] ? t("met") : t("notMet")})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
