"use client";

import { useTranslations } from "next-intl";
import { OfflineHint } from "../../components/ui/offline-hint";
import { useOnline } from "../../hooks/use-online";
import Link from "next/link";
import { useState, useMemo, useCallback } from "react";
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
  BarChart3,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
  Save,
  Settings,
  Trash2,
  X,
} from "lucide-react";
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

function shiftDate(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return formatDate(new Date(y!, m! - 1, d! + days));
}

function formatMealValue(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(1);
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
        aria-label="−"
        className="flex size-11 items-center justify-center rounded-xl border border-border-strong text-foreground transition-colors hover:bg-surface-raised active:scale-95 active:bg-surface-raised disabled:opacity-30 md:size-7 md:rounded md:text-foreground-muted"
      >
        <Minus size={14} />
      </button>
      <span
        aria-live="polite"
        className="w-10 text-center text-base font-semibold tabular-nums text-foreground md:w-8 md:text-sm"
      >
        {formatMealValue(value)}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={disabled || value >= 10}
        aria-label="+"
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

  const getValue = useCallback(
    (memberId: string, mealTypeId: string): number => {
      if (localGrid[memberId]?.[mealTypeId] !== undefined) {
        return localGrid[memberId][mealTypeId];
      }
      return entryMap[memberId]?.[mealTypeId] ?? 0;
    },
    [localGrid, entryMap],
  );

  const updateValue = useCallback(
    (memberId: string, mealTypeId: string, delta: number) => {
      setLocalGrid((prev) => {
        // Start from the member's saved row the first time it is touched.
        // The API replaces the whole `meals` object on save, so the edited
        // row must carry every meal type, not only the one that changed.
        const row = prev[memberId] ?? { ...(entryMap[memberId] ?? {}) };
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
    [entryMap],
  );

  const hasChanges = useMemo(() => {
    return Object.keys(localGrid).length > 0;
  }, [localGrid]);

  const saveMutation = useBulkSaveMealEntries(messId, monthId);
  const online = useOnline();

  const handleSave = () => {
    const entries = Object.entries(localGrid).map(([memberId, meals]) => ({
      memberId,
      date: new Date(selectedDate).toISOString(),
      // Saved values first, then the edits on top, so nothing is dropped.
      meals: { ...(entryMap[memberId] ?? {}), ...meals },
    }));

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
          <h1 className="mt-2 heading-tight text-2xl text-foreground sm:text-3xl">
            {t("mealManagement")}
          </h1>
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
          <h1 className="mt-2 heading-tight text-2xl text-foreground sm:text-3xl">
            {activeMonth.title}
          </h1>
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
            <label className="flex min-w-0 flex-1 items-center justify-center gap-2">
              <Calendar
                size={16}
                className="hidden shrink-0 text-foreground-muted sm:block"
              />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (!e.target.value) return;
                  setSelectedDate(e.target.value);
                  setLocalGrid({});
                }}
                className="min-w-0 bg-transparent py-2 text-center text-base text-foreground focus:outline-none sm:text-sm"
              />
            </label>
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
          <Link
            href="/dashboard/meals/reports"
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-border-strong px-3 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-raised sm:h-auto sm:rounded-lg sm:py-2"
          >
            <BarChart3 size={16} />
            {t("reports")}
          </Link>
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
          {isManager && (
            <div
              className={`bottom-above-nav fixed inset-x-4 z-40 items-center gap-3 rounded-2xl border border-border bg-surface-raised/95 p-2 pl-4 shadow-panel backdrop-blur-xl md:static md:mb-4 md:flex md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none ${
                hasChanges ? "animate-pop-in flex" : "hidden"
              }`}
            >
              {hasChanges && (
                <span className="flex-1 text-sm text-foreground md:hidden">
                  {t("unsavedChanges")}
                </span>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={!hasChanges || saveMutation.isPending || !online}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60 md:h-auto md:rounded-lg md:px-4 md:py-2"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    {t("saveTodaysMeals")}
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
          <div className={`space-y-3 md:hidden ${hasChanges ? "pb-20" : ""}`}>
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
              (activeMembers ?? []).map((member: MemberData) => {
                const total = activeMealTypes.reduce(
                  (sum, mt) => sum + getValue(member.id, mt.id),
                  0,
                );
                const edited = localGrid[member.id] !== undefined;
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
                            <span className="ml-1 text-xs text-foreground-muted">
                              ×{mt.value}
                            </span>
                          </span>
                          <MealCell
                            value={getValue(member.id, mt.id)}
                            onIncrement={() =>
                              updateValue(member.id, mt.id, mt.value || 1)
                            }
                            onDecrement={() =>
                              updateValue(member.id, mt.id, -(mt.value || 1))
                            }
                            disabled={!isManager}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
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
                      <span className="ml-1 text-foreground-muted/50">
                        ({mt.value})
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-foreground-muted">
                    {t("total")}
                  </th>
                </tr>
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
                                    updateValue(member.id, mt.id, mt.value || 1)
                                  }
                                  onDecrement={() =>
                                    updateValue(
                                      member.id,
                                      mt.id,
                                      -(mt.value || 1),
                                    )
                                  }
                                  disabled={!isManager}
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
      setError("Value must be between 0 and 10");
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
