"use client";

import { useState, useMemo, useCallback } from "react";
import { useGetMyMess } from "../../../hooks/use-messes";
import { useGetActiveMonth } from "../../../hooks/use-months";
import { useGetMealTypes } from "../../../hooks/use-messes";
import { useMembers } from "../../../hooks/use-members";
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

type Tab = "daily" | "member" | "monthly";

function MealCell({
  value,
  step,
  onIncrement,
  onDecrement,
  disabled,
}: {
  value: number;
  step: number;
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
        className="flex h-7 w-7 items-center justify-center rounded border border-foreground-muted/20 text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-30"
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
        className="flex h-7 w-7 items-center justify-center rounded border border-foreground-muted/20 text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-30"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function DailyReport({ messId, monthId }: { messId: string; monthId: string }) {
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

  const { data: report, isLoading } = useGetDailyMealReport(
    messId,
    monthId,
    date,
  );
  const { data: mealTypes } = useGetMealTypes(messId);
  const activeMealTypes = useMemo(
    () => (mealTypes ?? []).filter((mt) => mt.is_active),
    [mealTypes],
  );

  const { data: entries } = useGetMealEntries(messId, monthId, date, date);
  const { data: activeMembers } = useMembers(messId, { status: "ACTIVE" });
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
        <label className="text-sm font-medium text-foreground">Date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setIsEditing(false);
            setLocalGrid({});
          }}
          className="rounded-lg border border-foreground-muted/20 bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
        {isManager && report && report.entries.length > 0 && !isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-foreground-muted/20 px-3 py-2 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-raised"
          >
            <Edit3 size={14} />
            Edit Meals
          </button>
        )}
        {isEditing && (
          <>
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={saveMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg border border-foreground-muted/20 px-3 py-2 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-60"
            >
              <X size={14} />
              Cancel
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
              Save Changes
            </button>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : isEditing ? (
        <EditDailyGrid
          members={activeMembers ?? []}
          mealTypes={activeMealTypes}
          getValue={getValue}
          updateValue={updateValue}
        />
      ) : !report || report.entries.length === 0 ? (
        <div className="rounded-xl border border-foreground-muted/15 bg-surface p-8 text-center">
          <Calendar size={32} className="mx-auto mb-3 text-foreground-muted" />
          <p className="text-sm text-foreground-muted">
            No meals recorded for this date.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-foreground-muted/15 bg-surface p-3">
              <p className="text-xs text-foreground-muted">Members</p>
              <p className="text-lg font-bold text-foreground">
                {report.summary.total_members}
              </p>
            </div>
            <div className="rounded-lg border border-foreground-muted/15 bg-surface p-3">
              <p className="text-xs text-foreground-muted">Total Meals</p>
              <p className="text-lg font-bold text-foreground">
                {report.summary.total_meals}
              </p>
            </div>
            {Object.entries(report.summary.meal_type_totals).map(
              ([key, val]) => (
                <div
                  key={key}
                  className="rounded-lg border border-foreground-muted/15 bg-surface p-3"
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

          <div className="overflow-x-auto rounded-xl border border-foreground-muted/15 bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-foreground-muted/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted">
                    Member
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
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.entries.map((entry) => (
                  <tr
                    key={entry.member_id}
                    className="border-b border-foreground-muted/5"
                  >
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
  members: any[];
  mealTypes: { id: string; name: string; value: number }[];
  getValue: (memberId: string, mealTypeId: string) => number;
  updateValue: (memberId: string, mealTypeId: string, delta: number) => void;
}) {
  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-foreground-muted/15 bg-surface p-8 text-center">
        <p className="text-sm text-foreground-muted">
          No members in this mess yet.
        </p>
      </div>
    );
  }

  if (mealTypes.length === 0) {
    return (
      <div className="rounded-xl border border-foreground-muted/15 bg-surface p-8 text-center">
        <p className="text-sm text-foreground-muted">
          No active meal types. Add meal types from the main meals page.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-foreground-muted/15 bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-foreground-muted/10">
            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted">
              Member
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
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member: any) => {
            let rowTotal = 0;
            return (
              <tr
                key={member.id}
                className="border-b border-foreground-muted/5"
              >
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
                          step={mt.value || 1}
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

  const { data: report, isLoading } = useGetMemberMealReport(
    messId,
    monthId,
    selectedMemberId || undefined,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-foreground">Member:</label>
        <select
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
          className="rounded-lg border border-foreground-muted/20 bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">Select a member</option>
          {(members ?? []).map((m) => (
            <option key={m.user_id} value={m.id}>
              {m.user.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedMemberId ? (
        <div className="rounded-xl border border-foreground-muted/15 bg-surface p-8 text-center">
          <User size={32} className="mx-auto mb-3 text-foreground-muted" />
          <p className="text-sm text-foreground-muted">
            Select a member to view their meal report.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : !report || report.entries.length === 0 ? (
        <div className="rounded-xl border border-foreground-muted/15 bg-surface p-8 text-center">
          <p className="text-sm text-foreground-muted">
            No meals recorded for this member in this month.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-foreground-muted/15 bg-surface p-3">
              <p className="text-xs text-foreground-muted">Total Meals</p>
              <p className="text-lg font-bold text-foreground">
                {report.summary.total_meals}
              </p>
            </div>
            <div className="rounded-lg border border-foreground-muted/15 bg-surface p-3">
              <p className="text-xs text-foreground-muted">Days with Meals</p>
              <p className="text-lg font-bold text-foreground">
                {report.summary.total_entries}
              </p>
            </div>
            <div className="rounded-lg border border-foreground-muted/15 bg-surface p-3">
              <p className="text-xs text-foreground-muted">Avg/Day</p>
              <p className="text-lg font-bold text-foreground">
                {report.summary.average_meals_per_day}
              </p>
            </div>
            {Object.entries(report.summary.meal_type_totals).map(
              ([key, val]) => (
                <div
                  key={key}
                  className="rounded-lg border border-foreground-muted/15 bg-surface p-3"
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

          <div className="overflow-x-auto rounded-xl border border-foreground-muted/15 bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-foreground-muted/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted">
                    Date
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
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.entries.map((entry) => (
                  <tr
                    key={entry.date}
                    className="border-b border-foreground-muted/5"
                  >
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
  const { data: summary, isLoading } = useGetMonthMealSummary(messId, monthId);
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

  if (!summary || summary.member_summaries.length === 0) {
    return (
      <div className="rounded-xl border border-foreground-muted/15 bg-surface p-8 text-center">
        <BarChart3 size={32} className="mx-auto mb-3 text-foreground-muted" />
        <p className="text-sm text-foreground-muted">
          No meal data available for this month.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-foreground-muted/15 bg-surface p-3">
          <p className="text-xs text-foreground-muted">Total Meals</p>
          <p className="text-lg font-bold text-foreground">
            {summary.total_meals}
          </p>
        </div>
        <div className="rounded-lg border border-foreground-muted/15 bg-surface p-3">
          <p className="text-xs text-foreground-muted">Active Days</p>
          <p className="text-lg font-bold text-foreground">
            {summary.active_days}
          </p>
        </div>
        <div className="rounded-lg border border-foreground-muted/15 bg-surface p-3">
          <p className="text-xs text-foreground-muted">Total Entries</p>
          <p className="text-lg font-bold text-foreground">
            {summary.total_entries}
          </p>
        </div>
        {Object.entries(summary.meal_type_totals).map(([key, val]) => (
          <div
            key={key}
            className="rounded-lg border border-foreground-muted/15 bg-surface p-3"
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

      <div className="overflow-x-auto rounded-xl border border-foreground-muted/15 bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground-muted/10">
              <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted">
                Member
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-foreground-muted">
                Days
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
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {summary.member_summaries.map((ms) => (
              <tr
                key={ms.member_id}
                className="border-b border-foreground-muted/5"
              >
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
  const { data: myMess, isLoading: messLoading } = useGetMyMess();
  const messId = myMess?.id;
  const { data: activeMonth, isLoading: monthLoading } =
    useGetActiveMonth(messId);
  const monthId = activeMonth?.id;

  const [activeTab, setActiveTab] = useState<Tab>("monthly");

  const tabs: { key: Tab; label: string; icon: typeof Calendar }[] = [
    { key: "monthly", label: "Monthly Summary", icon: BarChart3 },
    { key: "daily", label: "Daily Report", icon: Calendar },
    { key: "member", label: "Member Report", icon: User },
  ];

  const isLoading = messLoading || monthLoading;

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
            Meal Reports
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            Meal Reports
          </h1>
        </div>
        <div className="rounded-xl border border-foreground-muted/15 bg-surface p-8 text-center">
          <p className="text-sm text-foreground-muted">
            No active month. Start a month from the dashboard to view reports.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Meal Reports
        </p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">
          {activeMonth.title}
        </h1>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg border border-foreground-muted/15 bg-surface p-1">
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
