"use client";

import { useState, useMemo, useCallback } from "react";
import { useGetMyMess } from "../../hooks/use-messes";
import { useGetActiveMonth } from "../../hooks/use-months";
import { useGetMealTypes } from "../../hooks/use-messes";
import { useMembers } from "../../hooks/use-members";
import {
  useGetMealEntries,
  useBulkSaveMealEntries,
} from "../../hooks/use-meals";
import type { MealEntryInfo } from "../../hooks/use-meals";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
  Save,
} from "lucide-react";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0] ?? "";
}

function formatDayHeader(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
}

function MealCell({
  value,
  onIncrement,
  onDecrement,
  disabled,
}: {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onDecrement}
        disabled={disabled || value <= 0}
        className="flex h-6 w-6 items-center justify-center rounded border border-foreground-muted/20 text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-30"
      >
        <Minus size={12} />
      </button>
      <span className="w-8 text-center text-sm font-semibold text-foreground">
        {value % 1 === 0 ? value : value.toFixed(1)}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={disabled || value >= 10}
        className="flex h-6 w-6 items-center justify-center rounded border border-foreground-muted/20 text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-30"
      >
        <Plus size={12} />
      </button>
    </div>
  );
}

export default function MealsPage() {
  const { data: myMess, isLoading: messLoading } = useGetMyMess();
  const messId = myMess?.id;
  const isManager = myMess?.current_user_role === "MANAGER";

  const { data: activeMonth, isLoading: monthLoading } =
    useGetActiveMonth(messId);
  const monthId = activeMonth?.id;

  const { data: mealTypes, isLoading: typesLoading } =
    useGetMealTypes(messId);
  const activeMealTypes = useMemo(
    () => (mealTypes ?? []).filter((mt) => mt.is_active),
    [mealTypes],
  );

  const [pageOffset, setPageOffset] = useState(0);
  const DAYS_PER_PAGE = 10;

  const { dates, startDate, endDate } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() + pageOffset * DAYS_PER_PAGE);
    const dates: Date[] = [];
    for (let i = 0; i < DAYS_PER_PAGE; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return {
      dates,
      startDate: formatDate(dates[0]!),
      endDate: formatDate(dates[dates.length - 1]!),
    };
  }, [pageOffset]);

  const { data: entries, isLoading: entriesLoading } = useGetMealEntries(
    messId,
    monthId,
    startDate,
    endDate,
  );

  const { data: activeMembers, isLoading: membersLoading } = useMembers(
    messId,
    { status: "ACTIVE" },
  );

  const [localGrid, setLocalGrid] = useState<
    Record<string, Record<string, Record<string, number>>>
  >({});

  const entryMap = useMemo(() => {
    const map: Record<string, Record<string, Record<string, number>>> = {};
    if (!entries) return map;
    for (const entry of entries) {
      const dateKey = entry.date.split("T")[0] ?? "";
      if (!map[dateKey]) map[dateKey] = {};
      map[dateKey][entry.member_id] = entry.meals;
    }
    return map;
  }, [entries]);

  const getValue = useCallback(
    (dateKey: string, memberId: string, mealTypeId: string): number => {
      if (localGrid[dateKey]?.[memberId]?.[mealTypeId] !== undefined) {
        return localGrid[dateKey][memberId][mealTypeId];
      }
      return entryMap[dateKey]?.[memberId]?.[mealTypeId] ?? 0;
    },
    [localGrid, entryMap],
  );

  const updateValue = useCallback(
    (dateKey: string, memberId: string, mealTypeId: string, delta: number) => {
      setLocalGrid((prev) => {
        const current = prev[dateKey]?.[memberId]?.[mealTypeId] ?? 0;
        const newVal = Math.max(0, Math.min(10, current + delta));
        return {
          ...prev,
          [dateKey]: {
            ...prev[dateKey],
            [memberId]: {
              ...prev[dateKey]?.[memberId],
              [mealTypeId]: newVal,
            },
          },
        };
      });
    },
    [],
  );

  const hasChanges = useMemo(() => {
    return Object.keys(localGrid).length > 0;
  }, [localGrid]);

  const saveMutation = useBulkSaveMealEntries(messId, monthId);

  const handleSave = () => {
    const entries = Object.entries(localGrid).flatMap(([dateKey, memberMap]) =>
      Object.entries(memberMap).map(([memberId, meals]) => ({
        memberId,
        date: new Date(dateKey).toISOString(),
        meals,
      })),
    );

    if (entries.length === 0) return;

    saveMutation.mutate(
      { entries },
      {
        onSuccess: () => {
          setLocalGrid({});
        },
      },
    );
  };

  const isLoading = messLoading || monthLoading || typesLoading || membersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeMonth) {
    return (
      <>
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Meals
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            Meal Management
          </h1>
        </div>
        <div className="rounded-xl border border-foreground-muted/15 bg-surface p-8 text-center">
          <p className="text-sm text-foreground-muted">
            No active month. Start a month from the dashboard to record meals.
          </p>
        </div>
      </>
    );
  }

  if (!activeMealTypes || activeMealTypes.length === 0) {
    return (
      <>
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Meals
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            Meal Management
          </h1>
        </div>
        <div className="rounded-xl border border-foreground-muted/15 bg-surface p-8 text-center">
          <p className="text-sm text-foreground-muted">
            No active meal types. Enable meal types in Mess Settings first.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Meals
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            {activeMonth.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPageOffset((p) => p - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-foreground-muted/20 text-foreground-muted transition-colors hover:bg-surface-raised"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-foreground">
            {formatDayHeader(dates[0]!)} — {formatDayHeader(dates[dates.length - 1]!)}
          </span>
          <button
            type="button"
            onClick={() => setPageOffset((p) => p + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-foreground-muted/20 text-foreground-muted transition-colors hover:bg-surface-raised"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {isManager && (
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={14} />
                Save Changes
              </>
            )}
          </button>
          {hasChanges && (
            <span className="text-xs text-foreground-muted">
              Unsaved changes
            </span>
          )}
          {saveMutation.isSuccess && (
            <span className="text-xs text-green-500">Saved!</span>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-foreground-muted/15 bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground-muted/10">
              <th className="sticky left-0 z-10 bg-surface px-4 py-3 text-left text-xs font-semibold text-foreground-muted">
                Member
              </th>
              {dates.map((d) => {
                const dateKey = formatDate(d);
                const isToday = formatDate(new Date()) === dateKey;
                return (
                  <th
                    key={dateKey}
                    className={`px-3 py-3 text-center text-xs font-semibold ${
                      isToday
                        ? "text-primary"
                        : "text-foreground-muted"
                    }`}
                  >
                    <div>{formatDayHeader(d)}</div>
                    <div className="mt-0.5 flex justify-center gap-1">
                      {activeMealTypes.map((mt) => (
                        <span
                          key={mt.id}
                          className="rounded bg-foreground-muted/10 px-1 py-0.5 text-[9px]"
                        >
                          {mt.name.slice(0, 3)}
                        </span>
                      ))}
                    </div>
                  </th>
                );
              })}
              <th className="px-4 py-3 text-center text-xs font-semibold text-foreground-muted">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {entriesLoading ? (
              <tr>
                <td
                  colSpan={dates.length + 2}
                  className="px-4 py-8 text-center"
                >
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                </td>
              </tr>
            ) : (activeMembers ?? []).length === 0 ? (
              <tr>
                <td
                  colSpan={dates.length + 2}
                  className="px-4 py-8 text-center text-sm text-foreground-muted"
                >
                  No members in this mess yet.
                </td>
              </tr>
            ) : (
              (activeMembers ?? []).map((member: any) => {
                let rowTotal = 0;
                return (
                  <tr
                    key={member.user_id}
                    className="border-b border-foreground-muted/5"
                  >
                    <td className="sticky left-0 z-10 bg-surface px-4 py-3">
                      <p className="font-medium text-foreground">
                        {member.user.name}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {member.user.email}
                      </p>
                    </td>
                    {dates.map((d) => {
                      const dateKey = formatDate(d);
                      let dayTotal = 0;
                      return (
                        <td
                          key={dateKey}
                          className="px-2 py-2 text-center"
                        >
                          <div className="flex flex-col items-center gap-1">
                            {activeMealTypes.map((mt) => {
                              const val = getValue(
                                dateKey,
                                member.user_id,
                                mt.id,
                              );
                              dayTotal += val;
                              return (
                                <MealCell
                                  key={mt.id}
                                  value={val}
                                  onIncrement={() =>
                                    updateValue(
                                      dateKey,
                                      member.user_id,
                                      mt.id,
                                      0.5,
                                    )
                                  }
                                  onDecrement={() =>
                                    updateValue(
                                      dateKey,
                                      member.user_id,
                                      mt.id,
                                      -0.5,
                                    )
                                  }
                                  disabled={!isManager}
                                />
                              );
                            })}
                            {dayTotal > 0 && (
                              <span className="text-[10px] text-foreground-muted">
                                {dayTotal % 1 === 0
                                  ? dayTotal
                                  : dayTotal.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      {(() => {
                        let total = 0;
                        for (const d of dates) {
                          const dateKey = formatDate(d);
                          for (const mt of activeMealTypes) {
                            total += getValue(dateKey, member.user_id, mt.id);
                          }
                        }
                        return (
                          <span className="font-semibold text-foreground">
                            {total % 1 === 0 ? total : total.toFixed(1)}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
