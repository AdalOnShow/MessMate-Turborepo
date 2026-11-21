"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { Avatar } from "./ui";

/* ---------- the month being run (matches the accounting section) ---------- */

type StepKey =
  | "account"
  | "members"
  | "month"
  | "meals"
  | "money"
  | "closeMonth";

const STEPS: {
  key: StepKey;
  who: "manager" | "everyone";
  phase: "setup" | "daily" | "close";
}[] = [
  { key: "account", who: "everyone", phase: "setup" },
  { key: "members", who: "manager", phase: "setup" },
  { key: "month", who: "manager", phase: "setup" },
  { key: "meals", who: "manager", phase: "daily" },
  { key: "money", who: "everyone", phase: "daily" },
  { key: "closeMonth", who: "manager", phase: "close" },
];

const WEEK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAYS_IN_MONTH = 31;
/** 1 August 2026 is a Saturday; the grid starts on Monday. */
const FIRST_WEEKDAY = 5;

const MEMBERS = [
  { initials: "AN", name: "Adal" },
  { initials: "FK", name: "Fahad" },
  { initials: "RU", name: "Rahim" },
  { initials: "KM", name: "Karim" },
];

/** 324 meals over the month: 10 a day, 11 on even days up to the 28th. */
const mealsOn = (d: number) => (d % 2 === 0 && d <= 28 ? 11 : 10);
/** ৳22,194 of bazaar, so the rate closes at exactly ৳68.50. */
const BAZAAR: Record<number, number> = {
  1: 2450,
  4: 2380,
  8: 2610,
  11: 2290,
  15: 2540,
  18: 2470,
  22: 2390,
  25: 2600,
  29: 2464,
};
/** The same deposits as the settlement table (৳12,386). */
const DEPOSITS: Record<number, number> = { 1: 4127, 2: 2923, 3: 3076, 6: 2260 };

const taka = (n: number) => `৳${Math.round(n).toLocaleString("en-US")}`;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/* ---------- scroll progress ---------- */

/** How far the reader has scrolled through an element, 0 to 1.
 *  "pin": 0 when its top reaches the top of the viewport, 1 when its bottom
 *  reaches the bottom (for a sticky track).
 *  "read": follows a reading line 60% down the screen (for a plain list). */
function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  mode: "pin" | "read" = "pin",
) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      const span = box.height - window.innerHeight;
      const value =
        mode === "read" || span <= 0
          ? clamp01((window.innerHeight * 0.6 - box.top) / box.height)
          : clamp01(-box.top / span);
      setProgress((prev) => (Math.abs(prev - value) < 0.002 ? prev : value));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ref, mode]);
  return progress;
}

/** What the calendar shows at a given point in the story. */
function monthState(progress: number) {
  const s = progress * STEPS.length;
  const step = Math.min(STEPS.length - 1, Math.floor(s));
  const local = clamp01(s - step);

  const members =
    step < 1 ? 0 : step === 1 ? Math.ceil(local * MEMBERS.length) : 4;
  const open = step >= 2;
  let filled = 0;
  if (step === 2) filled = local > 0.5 ? 1 : 0;
  if (step === 3) filled = 1 + Math.round(local * 19);
  if (step === 4) filled = 20 + Math.round(local * 7);
  if (step === 5) filled = Math.min(DAYS_IN_MONTH, 27 + Math.round(local * 8));
  const money = step >= 4;
  const closed = step === 5 && local > 0.6;

  let meals = 0;
  let bazaar = 0;
  let deposits = 0;
  for (let d = 1; d <= filled; d++) {
    meals += mealsOn(d);
    if (money) {
      bazaar += BAZAAR[d] ?? 0;
      deposits += DEPOSITS[d] ?? 0;
    }
  }
  return {
    step,
    members,
    open,
    filled,
    money,
    closed,
    meals,
    bazaar,
    deposits,
  };
}

/* ---------- component ---------- */

export function MonthRun() {
  const t = useTranslations("landing.howItWorks");
  const tw = useTranslations("landing.features.meals");

  const trackRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const progress = useScrollProgress(trackRef);
  const listProgress = useScrollProgress(listRef, "read");
  const state = monthState(progress);
  const active = STEPS[state.step]!;

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (span * (i + 0.5)) / STEPS.length });
  };

  const calendar = (
    <Calendar
      state={state}
      labels={{
        messName: t("calendar.messName"),
        month: t("calendar.month"),
        status: state.closed
          ? t("calendar.closed")
          : state.open
            ? t("calendar.open")
            : t("calendar.notStarted"),
        members: t("calendar.members"),
        noMembers: t("calendar.noMembers"),
        meals: t("calendar.meals"),
        bazaar: t("calendar.bazaar"),
        deposits: t("calendar.deposits"),
        mealRate: t("calendar.mealRate"),
        carry: t("calendar.carry", { month: t("calendar.next") }),
        week: WEEK.map((d) => tw(`week.${d}`)),
      }}
    />
  );

  return (
    <>
      {/* Desktop: the section pins and the month plays out as you scroll. */}
      <div
        ref={trackRef}
        className="relative mt-14 hidden lg:block"
        style={{ height: `${STEPS.length * 75 + 40}vh` }}
      >
        <div className="sticky top-[84px] grid h-[calc(100vh-108px)] max-h-[760px] grid-cols-12 items-center gap-12">
          <div className="col-span-5">
            <p className="text-sm font-semibold text-primary">
              {t(`phases.${active.phase}.label`)}
              <span className="font-normal text-foreground-muted">
                {" "}
                {t(`phases.${active.phase}.hint`)}
              </span>
            </p>

            <div className="relative mt-4 min-h-[18rem]">
              {STEPS.map((step, i) => (
                <div
                  key={step.key}
                  aria-hidden={i !== state.step}
                  className={`absolute inset-x-0 top-0 transition-[opacity,transform] duration-500 ease-out ${
                    i === state.step
                      ? "translate-y-0 opacity-100"
                      : i < state.step
                        ? "pointer-events-none -translate-y-4 opacity-0"
                        : "pointer-events-none translate-y-4 opacity-0"
                  }`}
                >
                  <p className="font-heading text-[5rem] font-extrabold leading-none tracking-[-0.05em] text-foreground/10">
                    {i + 1}
                  </p>
                  <h3 className="-mt-6 font-heading text-[clamp(1.75rem,2.6vw,2.5rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-foreground">
                    {t(`steps.${step.key}.title`)}
                  </h3>
                  <p className="mt-4 max-w-[44ch] text-base leading-relaxed text-foreground-muted">
                    {t(`steps.${step.key}.description`)}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-primary">
                    {t(step.who)}
                  </p>
                </div>
              ))}
            </div>

            {/* Step rail: shows where you are, and jumps on click. */}
            <ol className="mt-10 flex gap-2" aria-label={t("title")}>
              {STEPS.map((step, i) => {
                const fill =
                  i < state.step
                    ? 1
                    : i === state.step
                      ? clamp01(progress * STEPS.length - i)
                      : 0;
                return (
                  <li key={step.key} className="flex-1">
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      aria-current={i === state.step ? "step" : undefined}
                      aria-label={t("calendar.jump", {
                        n: i + 1,
                        title: t(`steps.${step.key}.title`),
                      })}
                      className="group block w-full py-2"
                    >
                      <span className="block h-1 overflow-hidden rounded-full bg-border-strong transition-[height] duration-200 group-hover:h-1.5">
                        <span
                          className="block h-full origin-left rounded-full bg-primary"
                          style={{ transform: `scaleX(${fill})` }}
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="mt-2 text-xs text-foreground-muted">
              {t("calendar.stepOf", {
                n: state.step + 1,
                total: STEPS.length,
              })}
            </p>
          </div>

          <div className="col-span-7">{calendar}</div>
        </div>
      </div>

      {/* Phones and tablets: a stacked timeline whose line fills as you scroll. */}
      <div className="mt-12 lg:hidden">
        <ol ref={listRef} className="relative space-y-10 pl-12">
          <span
            aria-hidden="true"
            className="absolute top-2 bottom-2 left-[15px] w-0.5 rounded-full bg-border-strong"
          />
          <span
            aria-hidden="true"
            className="absolute top-2 left-[15px] w-0.5 origin-top rounded-full bg-primary"
            style={{
              height: "calc(100% - 1rem)",
              transform: `scaleY(${listProgress})`,
            }}
          />
          {STEPS.map((step, i) => {
            const lit = listProgress >= i / STEPS.length;
            const firstOfPhase = i === 0 || STEPS[i - 1]!.phase !== step.phase;
            return (
              <li key={step.key} className="relative">
                <span
                  aria-hidden="true"
                  className={`absolute top-0 -left-12 flex size-8 items-center justify-center rounded-full border font-heading text-sm font-bold transition-colors duration-300 ${
                    lit
                      ? "border-primary bg-primary text-white"
                      : "border-border-strong bg-surface-sunken text-foreground-muted"
                  }`}
                >
                  {i + 1}
                </span>
                {firstOfPhase && (
                  <p className="mb-1 text-sm font-semibold text-primary">
                    {t(`phases.${step.phase}.label`)}
                    <span className="font-normal text-foreground-muted">
                      {" "}
                      {t(`phases.${step.phase}.hint`)}
                    </span>
                  </p>
                )}
                <h3
                  className={`font-heading text-xl font-bold transition-colors duration-300 ${
                    lit ? "text-foreground" : "text-foreground-muted"
                  }`}
                >
                  {t(`steps.${step.key}.title`)}
                </h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-foreground-muted">
                  {t(`steps.${step.key}.description`)}
                </p>
                <p className="mt-2 text-xs font-semibold text-primary">
                  {t(step.who)}
                </p>
              </li>
            );
          })}
        </ol>
        <div className="mt-12">
          <Calendar
            state={monthState(1)}
            labels={{
              messName: t("calendar.messName"),
              month: t("calendar.month"),
              status: t("calendar.closed"),
              members: t("calendar.members"),
              noMembers: t("calendar.noMembers"),
              meals: t("calendar.meals"),
              bazaar: t("calendar.bazaar"),
              deposits: t("calendar.deposits"),
              mealRate: t("calendar.mealRate"),
              carry: t("calendar.carry", { month: t("calendar.next") }),
              week: WEEK.map((d) => tw(`week.${d}`)),
            }}
          />
        </div>
      </div>
    </>
  );
}

/* ---------- the calendar card ---------- */

type MonthState = ReturnType<typeof monthState>;

function Calendar({
  state,
  labels,
}: {
  state: MonthState;
  labels: {
    messName: string;
    month: string;
    status: string;
    members: string;
    noMembers: string;
    meals: string;
    bazaar: string;
    deposits: string;
    mealRate: string;
    carry: string;
    week: string[];
  };
}) {
  const cells: (number | null)[] = [
    ...Array<null>(FIRST_WEEKDAY).fill(null),
    ...Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1),
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 sm:p-6">
      {/* Header: the mess, the month and its status. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar initials="RM" />
          <div>
            <p className="font-heading text-base font-bold text-foreground">
              {labels.messName}
            </p>
            <p
              className={`text-sm transition-colors duration-300 ${
                state.open ? "text-foreground-body" : "text-foreground-muted/60"
              }`}
            >
              {labels.month}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-300 ${
            state.closed
              ? "bg-accent-warm/15 text-accent-warm"
              : state.open
                ? "bg-success/15 text-success"
                : "bg-surface-raised text-foreground-muted"
          }`}
        >
          {labels.status}
        </span>
      </div>

      {/* Members joining. */}
      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
        <span className="mr-1 text-xs font-medium text-foreground-muted">
          {labels.members}
        </span>
        {state.members === 0 && (
          <span className="text-xs text-foreground-muted/60">
            {labels.noMembers}
          </span>
        )}
        {MEMBERS.map((m, i) => (
          <span
            key={m.initials}
            className={`transition-[opacity,transform] duration-300 ease-out ${
              i < state.members
                ? "scale-100 opacity-100"
                : "pointer-events-none absolute scale-50 opacity-0"
            }`}
            title={m.name}
          >
            <Avatar initials={m.initials} className="!size-7 !text-[10px]" />
          </span>
        ))}
      </div>

      {/* The month grid. */}
      <div
        className={`mt-4 transition-opacity duration-500 ${
          state.open ? "opacity-100" : "opacity-35"
        }`}
      >
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {labels.week.map((d) => (
            <span
              key={d}
              className="pb-1 text-[11px] font-medium text-foreground-muted"
            >
              {d}
            </span>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <span key={`blank-${i}`} />;
            const done = day <= state.filled;
            const latest = day === state.filled && !state.closed;
            return (
              <div
                key={day}
                className={`relative flex aspect-[5/4] flex-col items-center justify-center rounded-md text-[11px] transition-[background-color,color,box-shadow] duration-300 ${
                  done
                    ? state.closed
                      ? "bg-surface-overlay text-foreground-body"
                      : "bg-primary/20 text-foreground"
                    : "bg-surface-raised text-foreground-muted/60"
                } ${latest ? "ring-2 ring-primary" : ""}`}
              >
                <span className="font-semibold">{day}</span>
                {done && (
                  <span className="text-[10px] text-foreground-muted">
                    {mealsOn(day)}
                  </span>
                )}
                {done && state.money && (BAZAAR[day] || DEPOSITS[day]) && (
                  <span className="absolute top-1 right-1 flex gap-0.5">
                    {BAZAAR[day] ? (
                      <span className="size-1.5 rounded-full bg-accent-warm" />
                    ) : null}
                    {DEPOSITS[day] ? (
                      <span className="size-1.5 rounded-full bg-success" />
                    ) : null}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Running totals, then the meal rate once the month closes. */}
      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
        <Stat
          label={labels.meals}
          value={state.meals ? `${state.meals}` : "–"}
        />
        <Stat
          label={labels.bazaar}
          value={state.bazaar ? taka(state.bazaar) : "–"}
          dot="bg-accent-warm"
        />
        <Stat
          label={labels.deposits}
          value={state.deposits ? taka(state.deposits) : "–"}
          dot="bg-success"
        />
        <Stat
          label={labels.mealRate}
          value={state.closed ? "৳68.50" : "–"}
          strong={state.closed}
        />
      </dl>

      {/* Month-end: the closed stamp and the carry forward. */}
      <div
        aria-hidden={!state.closed}
        className={`pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center transition-[opacity,transform] duration-500 ease-out ${
          state.closed ? "scale-100 opacity-100" : "scale-110 opacity-0"
        }`}
      >
        <span className="-rotate-6 rounded-xl border-2 border-accent-warm bg-background/90 px-5 py-2 text-center">
          <span className="block font-heading text-xl font-extrabold text-accent-warm">
            {labels.status}
          </span>
          <span className="block text-xs text-foreground-body">
            {labels.carry}
          </span>
        </span>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  dot,
  strong,
}: {
  label: string;
  value: string;
  dot?: string;
  strong?: boolean;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-foreground-muted">
        {dot && <span className={`size-1.5 rounded-full ${dot}`} />}
        {label}
      </dt>
      <dd
        className={`mt-0.5 font-heading text-lg font-bold transition-colors duration-300 ${
          strong ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
