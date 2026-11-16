"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { WifiOff } from "lucide-react";
import { toast } from "@/app/store/toast";
import { useOnline } from "@/app/hooks/use-online";

/**
 * Sticky banner while the browser is offline. React Query pauses fetches
 * while offline and refetches on reconnect, so no extra wiring is needed
 * beyond telling the user what is going on.
 */
export function OfflineBanner() {
  const t = useTranslations("feedback.offlineBanner");
  const te = useTranslations("feedback.errors");
  const online = useOnline();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      toast.success(t("backOnline"));
    }
  }, [online, t]);

  if (online) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-100 flex items-center justify-center gap-2 bg-accent-warm px-4 py-2 text-center text-sm font-semibold text-cta-foreground"
    >
      <WifiOff size={16} aria-hidden />
      {te("offlineBanner")}
    </div>
  );
}
