"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const WEEK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const DAYS = [
  { lunch: 6, dinner: 5, members: 6 },
  { lunch: 5, dinner: 6, members: 6 },
  { lunch: 7, dinner: 7, members: 7 },
  { lunch: 6, dinner: 4, members: 6 },
  { lunch: 5, dinner: 5, members: 5 },
  { lunch: 8, dinner: 7, members: 8 },
  { lunch: 6, dinner: 6, members: 6 },
];
const TODAY = 2;

/** A week of meal counts. Hover or focus a day to read its tally; the
 *  selection returns to today when the pointer leaves the grid. */
export function MealWeek() {
  const t = useTranslations("landing.features.meals");
  const [active, setActive] = useState(TODAY);
  const day = DAYS[active]!;

  return (
    <div onMouseLeave={() => setActive(TODAY)}>
      <div className="grid grid-cols-7 gap-1.5 text-center sm:gap-2">
        {WEEK.map((d) => (
          <span
            key={d}
            className="pb-1 text-[11px] font-medium text-foreground-muted"
          >
            {t(`week.${d}`)}
          </span>
        ))}
        {DAYS.map((d, i) => {
          const on = i === active;
          return (
            <button
              key={WEEK[i]}
              type="button"
              aria-pressed={on}
              aria-label={t(`dayNames.${WEEK[i]!}`)}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className={`rounded-lg px-1 py-2 transition-[background-color,color,transform] duration-200 ease-out ${
                on
                  ? "-translate-y-0.5 bg-primary text-white"
                  : "bg-surface-raised text-foreground hover:bg-surface-overlay"
              }`}
            >
              <span
                className={`block text-[11px] font-semibold ${
                  on ? "text-white" : "text-foreground-muted"
                }`}
              >
                {i + 1}
              </span>
              <span className="mt-1.5 block text-[11px] font-bold sm:text-xs">
                {d.lunch}
                <span className="font-medium opacity-70">
                  {t("lunchShort")}
                </span>
              </span>
              <span className="block text-[11px] font-bold sm:text-xs">
                {d.dinner}
                <span className="font-medium opacity-70">
                  {t("dinnerShort")}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div
        className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-t border-border pt-4 text-sm"
        aria-live="polite"
      >
        <span className="font-semibold text-foreground">
          {t(`dayNames.${WEEK[active]!}`)}
        </span>
        <span className="text-foreground-muted">
          {t("tally", {
            meals: day.lunch + day.dinner,
            members: day.members,
          })}
        </span>
      </div>
    </div>
  );
}
