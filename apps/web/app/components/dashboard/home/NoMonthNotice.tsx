import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, CalendarOff } from "lucide-react";

/** Shown in place of the balance when no month is open. */
export function NoMonthNotice({ isManager }: { isManager: boolean }) {
  const t = useTranslations("dashboard.home");
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-dashed border-border-strong bg-surface p-5 sm:flex-row sm:items-center">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-warm/10 text-accent-warm">
        <CalendarOff size={20} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{t("noActiveMonth")}</p>
        <p className="mt-0.5 text-sm text-foreground-muted">
          {isManager ? t("noMonthManager") : t("noMonthMember")}
        </p>
      </div>
      {isManager ? (
        <Link
          href="/dashboard/months#month"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          {t("startInSettings")}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      ) : null}
    </section>
  );
}
