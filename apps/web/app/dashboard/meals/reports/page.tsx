"use client";

import { useTranslations } from "next-intl";
import { useState, useMemo, useCallback } from "react";
import { useGetMyMess } from "../../../hooks/use-messes";
import { useGetActiveMonth } from "../../../hooks/use-months";
import { useGetMealTypes } from "../../../hooks/use-messes";
import { useMembers } from "../../../hooks/use-members";
import type { MemberData } from "../../../hooks/use-members";
import {
  useGetMealEntries,
  useBulkSaveMealEntries,
} from "../../../hooks/use-meals";
import {
  useGetDailyMealReport,
  useGetMemberMealReport,
  useGetMonthMealSummary,
} from "../../../hooks/use-meals";
import {
  BarChart3,
  Calendar,
  Edit3,
  Loader2,
  Minus,
  Plus,
  Save,
  User,
  X,
} from "lucide-react";
import {
  QueriesErrorState,
  QueryErrorState,
  failedQueries,
} from "../../../components/feedback/QueryErrorState";

type Tab = "daily" | "member" | "monthly";

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
        className="flex h-7 w-7 items-center justify-center rounded border border-border-strong text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-30"
      >
        <Minus size={14} />
      </button>
      <span className="w-8 text-center text-sm font-semibold text-foreground">
        {value % 1 === 0 ? value : value.toFixed(1)}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={disabled || value >= 10}
        className="flex h-7 w-7 items-center justify-center rounded border border-border-strong text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-30"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function DailyReport({ messId, monthId }: { messId: string; monthId: string }) {
  const t = useTranslations("pages.mealsReports");
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0] ?? "";
  });
  const [isEditing, setIsEditing] = useState(false);
  const [localGrid, setLocalGrid] = useState<
    Record<string, Record<string, number>>
  >({});

  const { data: myMess } = useGetMyMess();
  const isManager = myMess?.current_user_role === "MANAGER";

  const reportQuery = useGetDailyMealReport(messId, monthId, date);
  const { data: report, isLoading } = reportQuery;
  const typesQuery = useGetMealTypes(messId);
  const { data: mealTypes } = typesQuery;
  const activeMealTypes = useMemo(
    () => (mealTypes ?? []).filter((mt) => mt.is_active),
    [mealTypes],
  );

  const entriesQuery = useGetMealEntries(messId, monthId, date, date);
  const { data: entries } = entriesQuery;
  const membersQuery = useMembers(messId, { status: "ACTIVE" });
  const { data: activeMembers } = membersQuery;
  // The edit grid is seeded from these; editing over a failed load would
  // save zeros over real entries.
  const dailyQueries = [reportQuery, typesQuery, entriesQuery, membersQuery];
  const dailyFailed = failedQueries(...dailyQueries).length > 0;
  const saveMutation = useBulkSaveMealEntries(messId, monthId);

  const entryMap = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    if (!entries) return map;
    for (const entry of entries) {
      map[entry.member_id] = entry.meals;
    }
    return map;
  }, [entries]);

  const mealTypeMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const mt of mealTypes ?? []) {
      map[mt.id] = mt.name;
    }
    return map;
  }, [mealTypes]);

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
        const current = prev[memberId]?.[mealTypeId] ?? 0;
        const newVal = Math.max(0, Math.min(10, current + delta));
        return {
          ...prev,
          [memberId]: {
            ...prev[memberId],
            [mealTypeId]: newVal,
          },
        };
      });
    },
    [],
  );

  const hasChanges = Object.keys(localGrid).length > 0;

  const handleSave = () => {
    const payload = Object.entries(localGrid).map(([memberId, meals]) => ({
      memberId,
      date: new Date(date).toISOString(),
      meals,
    }));

    if (payload.length === 0) return;

    saveMutation.mutate(
      { entries: payload },
      {
        onSuccess: () => {
          setLocalGrid({});
          setIsEditing(false);
        },
      },
    );
  };

  const handleCancelEdit = () => {
    setLocalGrid({});
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-foreground">{t("date")}</label>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setIsEditing(false);
            setLocalGrid({});
          }}
          className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
        />
        {isManager && report && report.entries.length > 0 && !isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-2 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-raised"
          >
            <Edit3 size={14} />
            {t("editMeals")}
          </button>
        )}
        {isEditing && (
          <>
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={saveMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-2 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-60"
            >
              <X size={14} />
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || saveMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {saveMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {t("saveChanges")}
            </button>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : dailyFailed ? (
        <QueriesErrorState queries={dailyQueries} resource="the daily report" />
      ) : isEditing ? (
        <EditDailyGrid
          members={activeMembers ?? []}
          mealTypes={activeMealTypes}
          getValue={getValue}
          updateValue={updateValue}
        />
      ) : !report || report.entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <Calendar size={32} className="mx-auto mb-3 text-foreground-muted" />
          <p className="text-sm text-foreground-muted">
            {t("noMealsRecordedDate")}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs text-foreground-muted">{t("members")}</p>
              <p className="text-lg font-bold text-foreground">
                {report.summary.total_members}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs text-foreground-muted">{t("totalMeals")}</p>
              <p className="text-lg font-bold text-foreground">
                {report.summary.total_meals}
              </p>
            </div>
            {Object.entries(report.summary.meal_type_totals).map(
              ([key, val]) => (
                <div
                  key={key}
                  className="rounded-lg border border-border bg-surface p-3"
                >
                  <p className="text-xs text-foreground-muted">
                    {mealTypeMap[key] ?? key}
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {val % 1 === 0 ? val : val.toFixed(1)}
                  </p>
                </div>
              ),
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted">
                    {t("member")}
                  </th>
                  {Object.entries(report.summary.meal_type_totals).map(
                    ([key]) => (
                      <th
                        key={key}
                        className="px-3 py-3 text-center text-xs font-semibold text-foreground-muted"
                      >
                        {mealTypeMap[key] ?? key}
                      </th>
                    ),
                  )}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-foreground-muted">
                    {t("total")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.entries.map((entry) => (
                  <tr key={entry.member_id} className="border-b border-border">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {entry.user.name}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {entry.user.email}
                      </p>
                    </td>
                    {Object.entries(report.summary.meal_type_totals).map(
                      ([key]) => (
                        <td
                          key={key}
                          className="px-3 py-3 text-center text-foreground"
                        >
                          {entry.meals[key] !== undefined
                            ? entry.meals[key] % 1 === 0
                              ? entry.meals[key]
                              : entry.meals[key]?.toFixed(1)
                            : "—"}
                        </td>
                      ),
                    )}
                    <td className="px-4 py-3 text-center font-semibold text-foreground">
                      {entry.total_meal % 1 === 0
                        ? entry.total_meal
                        : entry.total_meal.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function EditDailyGrid({
  members,
  mealTypes,
  getValue,
  updateValue,
}: {
  members: MemberData[];
  mealTypes: { id: string; name: string; value: number }[];
  getValue: (memberId: string, mealTypeId: string) => number;
  updateValue: (memberId: string, mealTypeId: string, delta: number) => void;
}) {
  const t = useTranslations("pages.mealsReports");
  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-foreground-muted">
          {t("noMembersMessYet")}
        </p>
      </div>
    );
  }

  if (mealTypes.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-foreground-muted">
          {t("noActiveMealTypes")}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted">
              {t("member")}
            </th>
            {mealTypes.map((mt) => (
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
          {members.map((member: MemberData) => {
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
                {mealTypes.map((mt) => {
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
                            updateValue(member.id, mt.id, -(mt.value || 1))
                          }
                        />
                      </div>
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center">
                  <span className="font-semibold text-foreground">
                    {rowTotal % 1 === 0 ? rowTotal : rowTotal.toFixed(1)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MemberReport({
  messId,
  monthId,
}: {
  messId: string;
  monthId: string;
}) {
  const t = useTranslations("pages.mealsReports");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const { data: members } = useMembers(messId, { status: "ACTIVE" });
  const { data: mealTypes } = useGetMealTypes(messId);

  const mealTypeMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const mt of mealTypes ?? []) {
      map[mt.id] = mt.name;
    }
    return map;
  }, [mealTypes]);

  const reportQuery = useGetMemberMealReport(
    messId,
    monthId,
    selectedMemberId || undefined,
  );
  const { data: report, isLoading } = reportQuery;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-foreground">{t("member2")}</label>
        <select
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
          className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
        >
          <option value="">{t("selectMember")}</option>
          {(members ?? []).map((m) => (
            <option key={m.user_id} value={m.id}>
              {m.user.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedMemberId ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <User size={32} className="mx-auto mb-3 text-foreground-muted" />
          <p className="text-sm text-foreground-muted">
            {t("selectMemberViewTheir")}
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : reportQuery.isError && !report ? (
        <QueryErrorState
          error={reportQuery.error}
          onRetry={reportQuery.refetch}
          isRetrying={reportQuery.isFetching}
          resource="this member's report"
        />
      ) : !report || report.entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-foreground-muted">
            {t("noMealsRecordedMember")}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs text-foreground-muted">{t("totalMeals")}</p>
              <p className="text-lg font-bold text-foreground">
                {report.summary.total_meals}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs text-foreground-muted">{t("daysMeals")}</p>
              <p className="text-lg font-bold text-foreground">
                {report.summary.total_entries}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs text-foreground-muted">{t("avgDay")}</p>
              <p className="text-lg font-bold text-foreground">
                {report.summary.average_meals_per_day}
              </p>
            </div>
            {Object.entries(report.summary.meal_type_totals).map(
              ([key, val]) => (
                <div
                  key={key}
                  className="rounded-lg border border-border bg-surface p-3"
                >
                  <p className="text-xs text-foreground-muted">
                    {mealTypeMap[key] ?? key}
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {val % 1 === 0 ? val : val.toFixed(1)}
                  </p>
                </div>
              ),
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted">
                    {t("date2")}
                  </th>
                  {Object.entries(report.summary.meal_type_totals).map(
                    ([key]) => (
                      <th
                        key={key}
                        className="px-3 py-3 text-center text-xs font-semibold text-foreground-muted"
                      >
                        {mealTypeMap[key] ?? key}
                      </th>
                    ),
                  )}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-foreground-muted">
                    {t("total")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.entries.map((entry) => (
                  <tr key={entry.date} className="border-b border-border">
                    <td className="px-4 py-3 text-foreground">
                      {new Date(entry.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    {Object.entries(report.summary.meal_type_totals).map(
                      ([key]) => (
                        <td
                          key={key}
                          className="px-3 py-3 text-center text-foreground"
                        >
                          {entry.meals[key] !== undefined
                            ? entry.meals[key] % 1 === 0
                              ? entry.meals[key]
                              : entry.meals[key]?.toFixed(1)
                            : "—"}
                        </td>
                      ),
                    )}
                    <td className="px-4 py-3 text-center font-semibold text-foreground">
                      {entry.total_meal % 1 === 0
                        ? entry.total_meal
                        : entry.total_meal.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function MonthlySummary({
  messId,
  monthId,
}: {
  messId: string;
  monthId: string;
}) {
  const t = useTranslations("pages.mealsReports");
  const summaryQuery = useGetMonthMealSummary(messId, monthId);
  const { data: summary, isLoading } = summaryQuery;
  const { data: mealTypes } = useGetMealTypes(messId);

  const mealTypeMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const mt of mealTypes ?? []) {
      map[mt.id] = mt.name;
    }
    return map;
  }, [mealTypes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (summaryQuery.isError && !summary) {
    return (
      <QueryErrorState
        error={summaryQuery.error}
        onRetry={summaryQuery.refetch}
        isRetrying={summaryQuery.isFetching}
        resource="the monthly summary"
      />
    );
  }

  if (!summary || summary.member_summaries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <BarChart3 size={32} className="mx-auto mb-3 text-foreground-muted" />
        <p className="text-sm text-foreground-muted">
          {t("noMealDataAvailable")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-3">
          <p className="text-xs text-foreground-muted">{t("totalMeals")}</p>
          <p className="text-lg font-bold text-foreground">
            {summary.total_meals}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3">
          <p className="text-xs text-foreground-muted">{t("activeDays")}</p>
          <p className="text-lg font-bold text-foreground">
            {summary.active_days}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3">
          <p className="text-xs text-foreground-muted">{t("totalEntries")}</p>
          <p className="text-lg font-bold text-foreground">
            {summary.total_entries}
          </p>
        </div>
        {Object.entries(summary.meal_type_totals).map(([key, val]) => (
          <div
            key={key}
            className="rounded-lg border border-border bg-surface p-3"
          >
            <p className="text-xs text-foreground-muted">
              {mealTypeMap[key] ?? key}
            </p>
            <p className="text-lg font-bold text-foreground">
              {val % 1 === 0 ? val : val.toFixed(1)}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted">
                {t("member")}
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-foreground-muted">
                {t("days")}
              </th>
              {Object.entries(summary.meal_type_totals).map(([key]) => (
                <th
                  key={key}
                  className="px-3 py-3 text-center text-xs font-semibold text-foreground-muted"
                >
                  {mealTypeMap[key] ?? key}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-semibold text-foreground-muted">
                {t("total")}
              </th>
            </tr>
          </thead>
          <tbody>
            {summary.member_summaries.map((ms) => (
              <tr key={ms.member_id} className="border-b border-border">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{ms.user.name}</p>
                  <p className="text-xs text-foreground-muted">
                    {ms.user.email}
                  </p>
                </td>
                <td className="px-3 py-3 text-center text-foreground-muted">
                  {ms.entry_count}
                </td>
                {Object.entries(summary.meal_type_totals).map(([key]) => (
                  <td
                    key={key}
                    className="px-3 py-3 text-center text-foreground"
                  >
                    {ms.meal_type_totals[key] !== undefined
                      ? ms.meal_type_totals[key] % 1 === 0
                        ? ms.meal_type_totals[key]
                        : ms.meal_type_totals[key]?.toFixed(1)
                      : "—"}
                  </td>
                ))}
                <td className="px-4 py-3 text-center font-semibold text-foreground">
                  {ms.total_meals % 1 === 0
                    ? ms.total_meals
                    : ms.total_meals.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function MealReportsPage() {
  const t = useTranslations("pages.mealsReports");
  const messQuery = useGetMyMess();
  const { data: myMess, isLoading: messLoading } = messQuery;
  const messId = myMess?.id;
  const monthQuery = useGetActiveMonth(messId);
  const { data: activeMonth, isLoading: monthLoading } = monthQuery;
  const monthId = activeMonth?.id;

  const [activeTab, setActiveTab] = useState<Tab>("monthly");

  const tabs: { key: Tab; label: string; icon: typeof Calendar }[] = [
    { key: "monthly", label: t("monthlySummary"), icon: BarChart3 },
    { key: "daily", label: t("dailyReport"), icon: Calendar },
    { key: "member", label: t("memberReport"), icon: User },
  ];

  const isLoading = messLoading || monthLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (failedQueries(messQuery, monthQuery).length > 0) {
    return (
      <QueriesErrorState
        queries={[messQuery, monthQuery]}
        resource="meal reports"
      />
    );
  }

  if (!activeMonth) {
    return (
      <>
        <div className="mb-8">
          <p className="label-mono text-primary">{t("mealReports")}</p>
          <h1 className="mt-2 heading-tight text-3xl text-foreground">
            {t("mealReports")}
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
      <div className="mb-8">
        <p className="label-mono text-primary">{t("mealReports")}</p>
        <h1 className="mt-2 heading-tight text-3xl text-foreground">
          {activeMonth.title}
        </h1>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg border border-border bg-surface p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? "bg-primary text-white"
                  : "text-foreground-muted hover:bg-surface-raised"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "daily" && messId && monthId && (
        <DailyReport messId={messId} monthId={monthId} />
      )}
      {activeTab === "member" && messId && monthId && (
        <MemberReport messId={messId} monthId={monthId} />
      )}
      {activeTab === "monthly" && messId && monthId && (
        <MonthlySummary messId={messId} monthId={monthId} />
      )}
    </>
  );
}
