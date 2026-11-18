"use client";

import { PageTips } from "../../components/help/PageTips";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { OfflineHint } from "../../components/ui/offline-hint";
import { useOnline } from "../../hooks/use-online";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetMyMess } from "../../hooks/use-messes";
import { useGetActiveMonth } from "../../hooks/use-months";
import {
  useGetMealTypes,
  useCreateMealType,
  useUpdateMealType,
  useDeleteMealType,
} from "../../hooks/use-messes";
import type { MealTypeInfo } from "../../hooks/use-messes";
import { useMembers, type MemberData } from "../../hooks/use-members";
import {
  useGetMealEntries,
  useBulkSaveMealEntries,
} from "../../hooks/use-meals";
import {
  Check,
  Lock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
  Save,
  Settings,
  Users,
  Trash2,
  X,
} from "lucide-react";
import { DatePicker } from "../../components/ui/date-picker";
import {
  QueriesErrorState,
  QueryErrorState,
  failedQueries,
} from "../../components/feedback/QueryErrorState";

// Local calendar date (YYYY-MM-DD). toISOString() would give the UTC date,
// which is still "yesterday" until 06:00 in Asia/Dhaka.
function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

function shiftDate(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return formatDate(new Date(y!, m! - 1, d! + days));
}

// Every +/− press changes a meal count by half a meal.
const MEAL_STEP = 0.5;

function formatMealValue(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

function MealCell({
  value,
  onIncrement,
  onDecrement,
  disabled,
  canIncrement = value !== null && value < 10,
  canDecrement = value !== null && value > 0,
  decrementLabel = "−",
  incrementLabel = "+",
}: {
  /** null = members have different values (shown as "–"). */
  value: number | null;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
  canIncrement?: boolean;
  canDecrement?: boolean;
  decrementLabel?: string;
  incrementLabel?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onDecrement}
        disabled={disabled || !canDecrement}
        aria-label={decrementLabel}
        className="flex size-11 items-center justify-center rounded-xl border border-border-strong text-foreground transition-colors hover:bg-surface-raised active:scale-95 active:bg-surface-raised disabled:opacity-30 md:size-7 md:rounded md:text-foreground-muted"
      >
        <Minus size={14} />
      </button>
      <span
        aria-live="polite"
        className="w-10 text-center text-base font-semibold tabular-nums text-foreground md:w-8 md:text-sm"
      >
        {value === null ? "–" : formatMealValue(value)}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={disabled || !canIncrement}
        aria-label={incrementLabel}
        className="flex size-11 items-center justify-center rounded-xl border border-border-strong text-foreground transition-colors hover:bg-surface-raised active:scale-95 active:bg-surface-raised disabled:opacity-30 md:size-7 md:rounded md:text-foreground-muted"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

export default function MealsPage() {
  const t = useTranslations("pages.meals");
  const messQuery = useGetMyMess();
  const { data: myMess, isLoading: messLoading } = messQuery;
  const messId = myMess?.id;
  const isManager = myMess?.current_user_role === "MANAGER";

  // The meal sheet is a manager tool; members see their meals on the
  // dashboard and in Reports. Covers typed URLs and the PWA shortcut.
  const router = useRouter();
  const isMember = !!myMess && !isManager;
  useEffect(() => {
    if (isMember) router.replace("/dashboard");
  }, [isMember, router]);

  const monthQuery = useGetActiveMonth(messId);
  const { data: activeMonth, isLoading: monthLoading } = monthQuery;
  const monthId = activeMonth?.id;

  const typesQuery = useGetMealTypes(messId);
  const { data: mealTypes, isLoading: typesLoading } = typesQuery;
  const activeMealTypes = useMemo(
    () => (mealTypes ?? []).filter((mt) => mt.is_active),
    [mealTypes],
  );

  const [selectedDate, setSelectedDate] = useState(() =>
    formatDate(new Date()),
  );
  // When a month closes and the next one opens, start again from today
  // instead of keeping a date the user had navigated to in the old month.
  const [dateMonthId, setDateMonthId] = useState(monthId);
  if (monthId !== dateMonthId) {
    setDateMonthId(monthId);
    if (dateMonthId !== undefined) setSelectedDate(formatDate(new Date()));
  }

  const entriesQuery = useGetMealEntries(
    messId,
    monthId,
    selectedDate,
    selectedDate,
  );
  const { data: entries, isLoading: entriesLoading } = entriesQuery;

  const membersQuery = useMembers(messId, { status: "ACTIVE" });
  const { data: activeMembers, isLoading: membersLoading } = membersQuery;

  const [localGrid, setLocalGrid] = useState<
    Record<string, Record<string, number>>
  >({});

  const entryMap = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    if (!entries) return map;
    for (const entry of entries) {
      map[entry.member_id] = entry.meals;
    }
    return map;
  }, [entries]);

  // Members with nothing saved for this day start from the meal types'
  // default counts (their `value`). These rows are only a suggestion: they
  // count as unsaved changes until the manager presses Save. Only managers
  // see them, and only once the day's entries have loaded, so a slow or
  // failed load never shows defaults over real data.
  // A day with meals is saved once. Changing it later happens one day at a
  // time in Reports, so this grid is read-only for it.
  const dayLocked = useMemo(
    () => (entries ?? []).some((e) => e.total_meal > 0),
    [entries],
  );

  const defaultRows = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    if (!isManager || !entries || dayLocked) return map;
    const row: Record<string, number> = {};
    for (const mt of activeMealTypes) {
      if (mt.value > 0) row[mt.id] = Math.min(10, mt.value);
    }
    if (Object.keys(row).length === 0) return map;
    for (const member of activeMembers ?? []) {
      if (!entryMap[member.id]) map[member.id] = row;
    }
    return map;
  }, [isManager, entries, dayLocked, activeMealTypes, activeMembers, entryMap]);

  // What the grid starts from for a member: their saved row, else defaults.
  const baseRow = useCallback(
    (memberId: string): Record<string, number> =>
      entryMap[memberId] ?? defaultRows[memberId] ?? {},
    [entryMap, defaultRows],
  );

  const getValue = useCallback(
    (memberId: string, mealTypeId: string): number => {
      if (localGrid[memberId]?.[mealTypeId] !== undefined) {
        return localGrid[memberId][mealTypeId];
      }
      return baseRow(memberId)[mealTypeId] ?? 0;
    },
    [localGrid, baseRow],
  );

  const updateValue = useCallback(
    (memberId: string, mealTypeId: string, delta: number) => {
      setLocalGrid((prev) => {
        // Start from the member's base row the first time it is touched.
        // The API replaces the whole `meals` object on save, so the edited
        // row must carry every meal type, not only the one that changed.
        const row = prev[memberId] ?? { ...baseRow(memberId) };
        const current = row[mealTypeId] ?? 0;
        const newVal = Math.max(0, Math.min(10, current + delta));
        return {
          ...prev,
          [memberId]: {
            ...row,
            [mealTypeId]: newVal,
          },
        };
      });
    },
    [baseRow],
  );

  // Apply one change to a meal type for every active member. Only members
  // whose value actually changes are added to the edit grid, so a bulk "−"
  // on people already at 0 doesn't create empty entries for them on save.
  const updateAll = useCallback(
    (mealTypeId: string, compute: (current: number) => number) => {
      setLocalGrid((prev) => {
        const next = { ...prev };
        for (const member of activeMembers ?? []) {
          const row = prev[member.id] ?? { ...baseRow(member.id) };
          const current = row[mealTypeId] ?? 0;
          const newVal = Math.max(0, Math.min(10, compute(current)));
          if (newVal === current) continue;
          next[member.id] = { ...row, [mealTypeId]: newVal };
        }
        return next;
      });
    },
    [activeMembers, baseRow],
  );

  // Rows to send on save: every edited member, plus every member still on
  // untouched defaults.
  const pendingRows = useMemo(() => {
    const rows: Record<string, Record<string, number>> = {};
    for (const [memberId, row] of Object.entries(defaultRows)) {
      rows[memberId] = row;
    }
    for (const [memberId, row] of Object.entries(localGrid)) {
      rows[memberId] = { ...baseRow(memberId), ...row };
    }
    return rows;
  }, [defaultRows, localGrid, baseRow]);

  const hasChanges = Object.keys(pendingRows).length > 0;
  const isUnsaved = (memberId: string) => pendingRows[memberId] !== undefined;

  const members = activeMembers ?? [];
  const showBulk =
    isManager &&
    !dayLocked &&
    !entriesLoading &&
    members.length > 0 &&
    activeMealTypes.length > 0;

  // Stepper props for the "everyone" row of a meal type. Shows the shared
  // value when all members match, "–" when they differ.
  const bulkProps = (mt: MealTypeInfo) => {
    const values = members.map((m) => getValue(m.id, mt.id));
    const first = values[0] ?? 0;
    return {
      value: values.every((v) => v === first) ? first : null,
      canIncrement: values.some((v) => v < 10),
      canDecrement: values.some((v) => v > 0),
      onIncrement: () => updateAll(mt.id, (v) => v + MEAL_STEP),
      onDecrement: () => updateAll(mt.id, (v) => v - MEAL_STEP),
      incrementLabel: t("addForEveryone", { meal: mt.name }),
      decrementLabel: t("removeForEveryone", { meal: mt.name }),
    };
  };

  const saveMutation = useBulkSaveMealEntries(messId, monthId);
  const online = useOnline();
  // Until the saved day is re-read, the old entries would make the default
  // rows look unsaved again for a moment, so keep Save disabled meanwhile.
  const [refreshing, setRefreshing] = useState(false);

  const handleSave = () => {
    const payload = Object.entries(pendingRows).map(([memberId, meals]) => ({
      memberId,
      // "YYYY-MM-DD" parses as UTC midnight, the form the API requires.
      date: new Date(selectedDate).toISOString(),
      meals,
    }));

    if (payload.length === 0) return;

    saveMutation.mutate(
      { entries: payload },
      {
        onSuccess: async () => {
          setRefreshing(true);
          try {
            await entriesQuery.refetch();
          } finally {
            setLocalGrid({});
            setRefreshing(false);
          }
        },
      },
    );
  };

  const isLoading =
    messLoading || monthLoading || typesLoading || membersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const pageQueries = [messQuery, monthQuery, typesQuery, membersQuery];
  if (failedQueries(...pageQueries).length > 0) {
    return <QueriesErrorState queries={pageQueries} resource="meals" />;
  }

  if (!activeMonth) {
    return (
      <>
        <div className="mb-8">
          <p className="label-mono text-primary">{t("meals")}</p>
          <div className="mt-2 flex items-start justify-between gap-3">
            <h1 className="heading-tight text-2xl text-foreground sm:text-3xl">
              {t("mealManagement")}
            </h1>
            <PageTips page="meals" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-foreground-muted">
            {t("noActiveMonthStart")}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="label-mono text-primary">{t("meals")}</p>
          <div className="mt-2 flex items-start justify-between gap-3">
            <h1 className="heading-tight text-2xl text-foreground sm:text-3xl">
              {activeMonth.title}
            </h1>
            <PageTips page="meals" />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex min-w-0 flex-1 items-center rounded-xl border border-border-strong bg-surface sm:flex-none">
            <button
              type="button"
              onClick={() => {
                setSelectedDate((d) => shiftDate(d, -1));
                setLocalGrid({});
              }}
              aria-label="Previous day"
              className="flex size-11 shrink-0 items-center justify-center text-foreground-muted active:text-foreground sm:size-9"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="min-w-0 flex-1">
              <DatePicker
                date={parseDate(selectedDate)}
                onSelect={(d) => {
                  if (!d) return;
                  setSelectedDate(formatDate(d));
                  setLocalGrid({});
                }}
                className="h-11 justify-center border-0 bg-transparent px-2 text-foreground hover:bg-transparent sm:h-9"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedDate((d) => shiftDate(d, 1));
                setLocalGrid({});
              }}
              aria-label="Next day"
              className="flex size-11 shrink-0 items-center justify-center text-foreground-muted active:text-foreground sm:size-9"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Without the saved entries the grid would show zeros, and saving it
          would overwrite real data, so show the error instead. */}
      {entriesQuery.isError && !entries ? (
        <QueryErrorState
          error={entriesQuery.error}
          onRetry={entriesQuery.refetch}
          isRetrying={entriesQuery.isFetching}
          resource="meal entries for this date"
        />
      ) : (
        <>
          {dayLocked && (
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center">
              <Lock size={18} className="shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {t("daySavedTitle")}
                </p>
                <p className="text-sm text-foreground-muted">
                  {t("daySavedHint")}
                </p>
              </div>
              {isManager && (
                <Link
                  href="/dashboard/reports"
                  className="flex h-11 shrink-0 items-center justify-center rounded-xl border border-border-strong px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-raised sm:h-auto sm:rounded-lg sm:py-2"
                >
                  {t("openReports")}
                </Link>
              )}
            </div>
          )}

          {isManager && !dayLocked && (
            <div
              className={`bottom-above-nav fixed inset-x-4 z-40 items-center gap-3 rounded-2xl border border-border bg-surface-raised/95 p-2 pl-4 shadow-panel backdrop-blur-xl md:static md:mb-4 md:flex md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none ${
                hasChanges ? "animate-pop-in flex" : "hidden"
              }`}
            >
              {hasChanges && (
                <span className="min-w-0 flex-1 text-sm leading-tight text-foreground md:hidden">
                  {t("unsavedChanges")}
                </span>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={
                  !hasChanges || saveMutation.isPending || refreshing || !online
                }
                className="flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60 md:h-auto md:rounded-lg md:px-4 md:py-2"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    {/* Short label on phones so the bar stays on one line. */}
                    <span className="md:hidden">{t("save")}</span>
                    <span className="hidden md:inline">
                      {t("saveTodaysMeals")}
                    </span>
                  </>
                )}
              </button>
              {hasChanges && (
                <span className="hidden text-xs text-foreground-muted md:inline">
                  {t("unsavedChanges")}
                </span>
              )}
              {hasChanges && <OfflineHint />}
            </div>
          )}

          {/* Phones: one card per member with large steppers */}
          <div className="space-y-3 md:hidden">
            {entriesLoading ? (
              <div className="flex justify-center rounded-2xl border border-border bg-surface py-10">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : activeMealTypes.length === 0 ? (
              <p className="rounded-2xl border border-border bg-surface px-4 py-10 text-center text-sm text-foreground-muted">
                {t("noActiveMealTypes")}
              </p>
            ) : (activeMembers ?? []).length === 0 ? (
              <p className="rounded-2xl border border-border bg-surface px-4 py-10 text-center text-sm text-foreground-muted">
                {t("noMembersMessYet")}
              </p>
            ) : (
              <>
                {showBulk && (
                  <div className="rounded-2xl border border-primary/30 bg-primary/6 p-4">
                    <p className="mb-3 flex items-center gap-2 font-semibold text-primary">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15">
                        <Users size={15} />
                      </span>
                      {t("everyone")}
                    </p>
                    <div className="space-y-1">
                      {activeMealTypes.map((mt) => (
                        <div
                          key={mt.id}
                          className="flex items-center justify-between gap-3 py-1.5"
                        >
                          <span className="min-w-0 text-sm text-foreground-body">
                            {mt.name}
                          </span>
                          <MealCell {...bulkProps(mt)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(activeMembers ?? []).map((member: MemberData) => {
                  const total = activeMealTypes.reduce(
                    (sum, mt) => sum + getValue(member.id, mt.id),
                    0,
                  );
                  const edited = isUnsaved(member.id);
                  return (
                    <div
                      key={member.id}
                      className={`rounded-2xl border bg-surface p-4 ${
                        edited ? "border-primary/40" : "border-border"
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="min-w-0 truncate font-semibold text-foreground">
                          {member.user.name}
                        </p>
                        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-primary">
                          {t("total")} {formatMealValue(total)}
                        </span>
                      </div>
                      <div className="divide-y divide-border">
                        {activeMealTypes.map((mt) => (
                          <div
                            key={mt.id}
                            className="flex items-center justify-between gap-3 py-1.5"
                          >
                            <span className="min-w-0 text-sm text-foreground-body">
                              {mt.name}
                            </span>
                            <MealCell
                              value={getValue(member.id, mt.id)}
                              onIncrement={() =>
                                updateValue(member.id, mt.id, MEAL_STEP)
                              }
                              onDecrement={() =>
                                updateValue(member.id, mt.id, -MEAL_STEP)
                              }
                              disabled={!isManager || dayLocked}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted">
                    {t("member")}
                  </th>
                  {activeMealTypes.map((mt) => (
                    <th
                      key={mt.id}
                      className="px-4 py-3 text-center text-xs font-semibold text-foreground-muted"
                    >
                      {mt.name}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-foreground-muted">
                    {t("total")}
                  </th>
                </tr>
                {showBulk && (
                  <tr className="border-b border-primary/20 bg-primary/6">
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15">
                          <Users size={15} />
                        </span>
                        {t("everyone")}
                      </span>
                    </td>
                    {activeMealTypes.map((mt) => (
                      <td key={mt.id} className="px-4 py-2.5">
                        <div className="flex justify-center">
                          <MealCell {...bulkProps(mt)} />
                        </div>
                      </td>
                    ))}
                    <td />
                  </tr>
                )}
              </thead>
              <tbody>
                {entriesLoading ? (
                  <tr>
                    <td
                      colSpan={activeMealTypes.length + 2}
                      className="px-4 py-8 text-center"
                    >
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                    </td>
                  </tr>
                ) : activeMealTypes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={activeMealTypes.length + 2}
                      className="px-4 py-12 text-center"
                    >
                      <p className="text-sm text-foreground-muted">
                        {t("noActiveMealTypes")}
                      </p>
                    </td>
                  </tr>
                ) : (activeMembers ?? []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={activeMealTypes.length + 2}
                      className="px-4 py-8 text-center text-sm text-foreground-muted"
                    >
                      {t("noMembersMessYet")}
                    </td>
                  </tr>
                ) : (
                  (activeMembers ?? []).map((member: MemberData) => {
                    let rowTotal = 0;
                    return (
                      <tr key={member.id} className="border-b border-border">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">
                            {member.user.name}
                          </p>
                          <p className="text-xs text-foreground-muted">
                            {member.user.email}
                          </p>
                        </td>
                        {activeMealTypes.map((mt) => {
                          const val = getValue(member.id, mt.id);
                          rowTotal += val;
                          return (
                            <td key={mt.id} className="px-4 py-3 text-center">
                              <div className="flex justify-center">
                                <MealCell
                                  value={val}
                                  onIncrement={() =>
                                    updateValue(member.id, mt.id, MEAL_STEP)
                                  }
                                  onDecrement={() =>
                                    updateValue(member.id, mt.id, -MEAL_STEP)
                                  }
                                  disabled={!isManager || dayLocked}
                                />
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-foreground">
                            {rowTotal % 1 === 0
                              ? rowTotal
                              : rowTotal.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {isManager && messId && (
        <MealTypeManager messId={messId} mealTypes={mealTypes ?? []} />
      )}

      {/* Phones: room at the very end of the page for the floating save bar,
          so the last section (meal type settings) can scroll out from under
          it. */}
      {isManager && hasChanges && (
        <div aria-hidden className="h-24 md:hidden" />
      )}
    </>
  );
}

function CreateMealTypeForm({
  messId,
  onCancel,
}: {
  messId: string;
  onCancel: () => void;
}) {
  const t = useTranslations("pages.meals");
  const createMealType = useCreateMealType(messId);
  const [name, setName] = useState("");
  const [value, setValue] = useState("1");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    const trimmed = name.trim();

    if (!trimmed) {
      setError(t("nameRequired"));
      return;
    }

    if (trimmed.length > 50) {
      setError(t("nameMustAtMost"));
      return;
    }

    const numVal = parseFloat(value);
    if (isNaN(numVal) || numVal < 0 || numVal > 10) {
      setError("Default must be between 0 and 10");
      return;
    }

    createMealType.mutate(
      { name: trimmed, value: numVal },
      {
        onSuccess: () => {
          setName("");
          setValue("1");
          onCancel();
        },
      },
    );
  };

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="mb-3 flex items-center gap-2">
        <Plus size={16} className="text-primary" />
        <p className="text-sm font-semibold text-foreground">
          {t("newMealType")}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder={t("eGBreakfastLunch")}
            className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 ${
              error
                ? "border-destructive focus:ring-destructive/40"
                : "border-border-strong focus:ring-primary/40"
            }`}
            disabled={createMealType.isPending}
          />
        </div>
        <div className="w-full sm:w-28">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            max="10"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("value2")}
            className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
            disabled={createMealType.isPending}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={createMealType.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-60"
          >
            <X size={14} />
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={createMealType.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {createMealType.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            {t("add")}
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}

function MealTypeRow({
  mealType,
  messId,
}: {
  mealType: MealTypeInfo;
  messId: string;
}) {
  const t = useTranslations("pages.meals");
  const updateMealType = useUpdateMealType(messId);
  const deleteMealType = useDeleteMealType(messId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleToggleActive = () => {
    updateMealType.mutate({
      mealTypeId: mealType.id,
      data: { is_active: !mealType.is_active },
    });
  };

  const handleValueChange = (newValue: string) => {
    const num = parseFloat(newValue);
    if (isNaN(num)) return;
    updateMealType.mutate({
      mealTypeId: mealType.id,
      data: { value: num },
    });
  };

  const handleDelete = () => {
    deleteMealType.mutate(mealType.id, {
      onSuccess: () => setConfirmDelete(false),
    });
  };

  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
        mealType.is_active
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-surface"
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggleActive}
          disabled={updateMealType.isPending}
          className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors before:absolute before:-inset-3 before:content-[''] ${
            mealType.is_active
              ? "border-primary bg-primary text-white"
              : "border-border-strong bg-transparent"
          }`}
        >
          {mealType.is_active && <Check size={12} />}
        </button>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {mealType.name}
          </p>
          <p className="text-xs text-foreground-muted">
            {mealType.is_active ? "Active" : "Inactive"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {mealType.is_active && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-foreground-muted">
              {t("value")}
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              max="10"
              defaultValue={mealType.value}
              onBlur={(e) => handleValueChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleValueChange(e.currentTarget.value);
                }
              }}
              className="w-20 rounded-md border border-border-strong bg-surface-sunken px-2 py-1 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
            />
          </div>
        )}

        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground-muted">{t("delete")}</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMealType.isPending}
              className="rounded bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20"
            >
              {deleteMealType.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                "Yes"
              )}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded bg-surface-raised px-2 py-1 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-overlay"
            >
              {t("no")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded p-1.5 text-foreground-muted transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function MealTypeManager({
  messId,
  mealTypes,
}: {
  messId: string;
  mealTypes: MealTypeInfo[];
}) {
  const t = useTranslations("pages.meals");
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const activeTypes = mealTypes.filter((mt) => mt.is_active);
  const inactiveTypes = mealTypes.filter((mt) => !mt.is_active);

  return (
    <div className="mt-8 rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <Settings size={18} className="text-foreground-muted" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t("mealTypeSettings")}
            </p>
            <p className="text-xs text-foreground-muted">
              {activeTypes.length} active, {inactiveTypes.length}{" "}
              {t("inactive")}
            </p>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`text-foreground-muted transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-border px-5 py-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs text-foreground-muted">
              {t("configureMealTypesMess")}
            </p>
            {!showCreate && (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-raised"
              >
                <Plus size={12} />
                {t("addType")}
              </button>
            )}
          </div>

          {showCreate && (
            <div className="mb-4">
              <CreateMealTypeForm
                messId={messId}
                onCancel={() => setShowCreate(false)}
              />
            </div>
          )}

          {mealTypes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-strong p-6 text-center">
              <p className="text-sm text-foreground-muted">
                {t("noMealTypesConfigured")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeTypes.map((mt) => (
                <MealTypeRow key={mt.id} mealType={mt} messId={messId} />
              ))}
              {inactiveTypes.map((mt) => (
                <MealTypeRow key={mt.id} mealType={mt} messId={messId} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
