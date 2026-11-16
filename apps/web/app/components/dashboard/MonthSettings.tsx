"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  CalendarOff,
  History,
  Loader2,
  Plus,
} from "lucide-react";
import { useCreateMonth, useGetActiveMonth } from "../../hooks/use-months";
import { QueryErrorState } from "../feedback/QueryErrorState";
import { Sheet, SheetActions } from "../ui/sheet";
import { Skeleton } from "../ui/skeleton";

const defaultTitle = () =>
  new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

/** Settings card that opens the first month or closes the active one and opens the next. */
export function MonthSettings({ messId }: { messId: string }) {
  const t = useTranslations("pages.settings");
  const monthQuery = useGetActiveMonth(messId);
  const month = monthQuery.data;
  const createMonth = useCreateMonth(messId);
  const creating = createMonth.isPending;
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const ref = useRef<HTMLElement>(null);

  // Arriving from the dashboard's "Start in Settings" link.
  useEffect(() => {
    if (window.location.hash === "#month") {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const openSheet = () => {
    createMonth.reset();
    setTitle(defaultTitle());
    setOpen(true);
  };

  const submit = () => {
    createMonth.mutate(
      { title: title.trim() || defaultTitle() },
      { onSuccess: () => setOpen(false) },
    );
  };

  const startedOn = month?.started_at
    ? new Date(month.started_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <section
      ref={ref}
      id="month"
      className="scroll-mt-20 rounded-xl border border-border bg-surface p-6 lg:col-span-2"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t("month")}
          </h2>
          <p className="mt-1 text-xs text-foreground-muted">{t("monthDesc")}</p>
        </div>
        <Link
          href="/dashboard/months"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground"
        >
          <History size={14} aria-hidden="true" />
          {t("viewHistory")}
        </Link>
      </div>

      {monthQuery.isPending ? (
        <Skeleton className="h-[72px] rounded-xl" />
      ) : monthQuery.isError && !month ? (
        // Never offer "start month" when we can't tell if one is open:
        // starting one closes the current month for good.
        <QueryErrorState
          compact
          error={monthQuery.error}
          onRetry={monthQuery.refetch}
          isRetrying={monthQuery.isFetching}
          resource="this month"
        />
      ) : (
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-background/40 p-4 sm:flex-row sm:items-center">
          <span
            className={
              month
                ? "flex size-10 shrink-0 items-center justify-center rounded-full bg-success/10 text-success"
                : "flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-warm/10 text-accent-warm"
            }
          >
            {month ? <CalendarDays size={18} /> : <CalendarOff size={18} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-foreground">
              {month ? month.title : t("noActiveMonth")}
            </p>
            <p className="text-xs text-foreground-muted">
              {month && startedOn
                ? t("startedOn", { date: startedOn })
                : t("noActiveMonthDesc")}
            </p>
          </div>
          <button
            type="button"
            onClick={openSheet}
            disabled={creating}
            className={
              month
                ? "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border-strong px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-raised disabled:opacity-60"
                : "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            }
          >
            <Plus size={15} aria-hidden="true" />
            {month ? t("startNewMonth") : t("startMonth")}
          </button>
        </div>
      )}

      {open && (
        <Sheet
          onClose={() => setOpen(false)}
          title={month ? t("startNewMonthTitle") : t("startMonthTitle")}
          dismissible={!creating}
        >
          {month ? (
            <p className="mb-4 text-sm text-foreground-muted">
              {t("closes")}{" "}
              <span className="font-semibold text-foreground">
                {month.title}
              </span>
              {t("closesRest")}
            </p>
          ) : null}

          <label
            htmlFor="new-month-title"
            className="mb-1.5 block text-xs font-semibold text-foreground-muted"
          >
            {month ? t("newMonthName") : t("monthName")}
          </label>
          <input
            id="new-month-title"
            type="text"
            value={title}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
            disabled={creating}
            className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-base text-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none sm:text-sm"
          />

          <SheetActions>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={creating}
              className="rounded-lg border border-border-strong px-4 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-60"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={creating}
              className={
                month
                  ? "inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-destructive/90 disabled:opacity-60"
                  : "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
              }
            >
              {creating && <Loader2 size={14} className="animate-spin" />}
              {creating
                ? month
                  ? t("closingMonth")
                  : t("starting")
                : month
                  ? t("closeStartNew")
                  : t("startMonth")}
            </button>
          </SheetActions>
        </Sheet>
      )}
    </section>
  );
}
