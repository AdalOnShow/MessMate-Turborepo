"use client";

import { useTranslations } from "next-intl";
import { WifiOff } from "lucide-react";
import { useOnline } from "@/app/hooks/use-online";

/** Small note under a save button while offline (the button is disabled). */
export function OfflineHint() {
  const t = useTranslations("feedback.errors");
  const online = useOnline();
  if (online) return null;
  return (
    <p className="mt-2 flex items-center gap-1.5 text-sm text-accent-warm">
      <WifiOff size={14} aria-hidden />
      {t("offlineHint")}
    </p>
  );
}
